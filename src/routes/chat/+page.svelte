<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LanguageSwitcher from '$lib/components/common/LanguageSwitcher.svelte';
	import Markdown from '$lib/components/common/Markdown.svelte';
	import ChatQuoteCard from '$lib/components/chat/ChatQuoteCard.svelte';
	import { cn } from '$lib/utils';
	import {
		ArrowLeft,
		Send,
		Image as ImageIcon,
		Bot,
		User,
		Sparkles,
		Calculator,
		CheckCircle2
	} from 'lucide-svelte';
	import type { ChatMessage, RoomAnalysis, Quote } from '$lib/types';
	import imageCompression from 'browser-image-compression';
	import { parseDimensionsFromText, createSyntheticAnalysis, updateAnalysisFromText } from '$lib/services/dimension-parser';

	const session = getSessionContext();
	const t = session.translations.chat;

	let messages = $state<ChatMessage[]>([]);
	let inputValue = $state('');
	let isLoading = $state(false);
	let isAnalyzingImage = $state(false);
	let isGeneratingQuote = $state(false);
	let isGeneratingPdf = $state(false);
	let pendingImage = $state<string | null>(null);
	let messagesContainer = $state<HTMLDivElement | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let streamingContent = $state('');

	// Track if we've shown the "ready for quote" message
	let hasShownReadyMessage = $state(false);

	const suggestions = [t.suggestions.s1, t.suggestions.s2, t.suggestions.s3];

	onMount(() => {
		// Add welcome message
		messages = [
			{
				id: crypto.randomUUID(),
				role: 'assistant',
				content: t.welcome,
				timestamp: new Date()
			}
		];
	});

	async function scrollToBottom() {
		await tick();
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function sendMessage(content?: string) {
		const messageText = content || inputValue.trim();
		if (!messageText && !pendingImage) return;

		// Add user message
		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content:
				messageText ||
				(session.language === 'es' ? 'Analiza esta imagen' : 'Analyze this image'),
			timestamp: new Date(),
			imageUrl: pendingImage || undefined
		};

		messages = [...messages, userMessage];
		session.addChatMessage(userMessage);

		inputValue = '';
		const imageToSend = pendingImage;
		const imageUrl = pendingImage;
		pendingImage = null;

		await scrollToBottom();

		// If there's an image and we don't have analysis yet, analyze it first
		if (imageToSend && !session.chatAnalysis) {
			const imageBase64 = imageToSend.split(',')[1];
			await analyzeRoomImage(imageBase64, imageToSend);
			return; // Analysis function handles the response
		}

		// Get AI response with streaming
		isLoading = true;
		streamingContent = '';

		try {
			// Build context for the chat API including current analysis data
			const chatContext = {
				hasAnalysis: !!session.chatAnalysis,
				analysis: session.chatAnalysis ? {
					roomType: session.chatAnalysis.roomType,
					area: session.chatAnalysis.dimensions.area,
					windows: session.chatAnalysis.windows.count,
					windowOrientation: session.chatAnalysis.windows.orientation,
					hasSolarFilm: session.chatAnalysis.windows.hasSolarFilm,
					estimatedOccupancy: session.chatAnalysis.estimatedOccupancy,
					detectedEquipment: session.chatAnalysis.detectedEquipment,
					hasDirectSunlight: session.chatAnalysis.hasDirectSunlight,
					// Track if window/equipment info has been explicitly asked
					windowsConfirmed: session.chatAnalysis.windows.orientation !== 'unknown',
					equipmentAsked: session.chatAnalysis.detectedEquipment.length > 0 ||
						(session.chatUserInputs as Record<string, unknown>).equipmentAsked === true
				} : null,
				userInputs: session.chatUserInputs
			};

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: messages.filter(
						(m) => m.role !== 'assistant' || m.id !== messages[0].id
					).filter(
						(m) => m.content !== '__QUOTE_CARD__' // Filter out quote card placeholders
					),
					language: session.language,
					imageBase64: imageToSend?.split(',')[1],
					context: chatContext
				})
			});

			if (!response.ok) {
				throw new Error('Stream failed');
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('No reader available');
			}

			const decoder = new TextDecoder();
			let accumulatedContent = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				// Plain text stream from toTextStreamResponse
				const chunk = decoder.decode(value, { stream: true });
				accumulatedContent += chunk;
				streamingContent = accumulatedContent;
				await scrollToBottom();
			}

			// Final message
			if (accumulatedContent) {
				const assistantMessage: ChatMessage = {
					id: crypto.randomUUID(),
					role: 'assistant',
					content: accumulatedContent,
					timestamp: new Date()
				};

				messages = [...messages, assistantMessage];
				session.addChatMessage(assistantMessage);
				streamingContent = '';

				// Try to extract occupancy info from the conversation
				extractUserInputsFromMessage(messageText);
			} else {
				throw new Error('No content received');
			}
		} catch (error) {
			console.error('Chat error:', error);
			messages = [
				...messages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					content: session.translations.errors.network_error,
					timestamp: new Date()
				}
			];
		} finally {
			isLoading = false;
			streamingContent = '';
			await scrollToBottom();
		}
	}

	// Try to extract user inputs from message (like number of occupants, dimensions, windows, equipment)
	function extractUserInputsFromMessage(message: string) {
		// Parse dimensions and room info from the message
		const parsed = parseDimensionsFromText(message);

		// If we don't have an analysis yet and the user provided dimensions, create a synthetic one
		if (!session.chatAnalysis && parsed.dimensions?.area && parsed.dimensions.area >= 5) {
			const syntheticAnalysis = createSyntheticAnalysis(parsed, session.language);
			session.setChatAnalysis(syntheticAnalysis);

			// If occupants were also detected, update user inputs
			if (parsed.occupants) {
				session.updateChatUserInputs({ occupants: parsed.occupants });
			}
		} else if (session.chatAnalysis) {
			// We already have an analysis - update it with any new info from this message
			const hasNewInfo = parsed.occupants !== undefined ||
				parsed.windows !== undefined ||
				parsed.equipment !== undefined ||
				parsed.hasDirectSunlight !== undefined;

			if (hasNewInfo) {
				const updatedAnalysis = updateAnalysisFromText(session.chatAnalysis, parsed);
				session.setChatAnalysis(updatedAnalysis);
			}

			// Update occupants in user inputs if provided
			if (parsed.occupants && !session.chatUserInputs.occupants) {
				session.updateChatUserInputs({ occupants: parsed.occupants });
			}
		}

		// Fall back to simple number extraction for occupancy if nothing else detected
		if (!parsed.occupants && !session.chatUserInputs.occupants) {
			const numberMatch = message.match(/\b(\d{1,2})\b/);
			if (numberMatch) {
				const num = parseInt(numberMatch[1], 10);
				// Only accept reasonable occupancy numbers (1-50)
				if (num >= 1 && num <= 50) {
					session.updateChatUserInputs({ occupants: num });
				}
			}
		}

		// Detect user confirmation for quote generation
		// Only trigger when we have all the info and the user hasn't already confirmed
		if (session.chatHasAllInfo && !session.chatWantsQuote) {
			const confirmPatterns = /\b(s[ií]|yes|yeah|dale|claro|por favor|porfa|genera|cotiza|quiero|ok|okay|listo|va|adelante|hazlo|please)\b/i;
			if (confirmPatterns.test(message)) {
				session.setChatWantsQuote(true);
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	async function handleImageSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const compressed = await imageCompression(file, {
				maxSizeMB: 1,
				maxWidthOrHeight: 1920,
				useWebWorker: true
			});

			const reader = new FileReader();
			reader.onload = (e) => {
				pendingImage = e.target?.result as string;
			};
			reader.readAsDataURL(compressed);
		} catch (error) {
			console.error('Image processing error:', error);
		}
	}

	// Analyze room image using the VLM API
	async function analyzeRoomImage(imageBase64: string, imageUrl: string): Promise<RoomAnalysis | null> {
		isAnalyzingImage = true;

		// Add analyzing message
		const analyzingMsgId = crypto.randomUUID();
		messages = [
			...messages,
			{
				id: analyzingMsgId,
				role: 'assistant',
				content: t.analysis?.analyzing || 'Analyzing your image...',
				timestamp: new Date(),
				metadata: { analysisTriggered: true }
			}
		];
		await scrollToBottom();

		try {
			const response = await fetch('/api/analyze-room', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					imageBase64,
					language: session.language
				})
			});

			const data = await response.json();

			if (data.success && data.analysis) {
				// Save analysis to session
				session.setChatAnalysis(data.analysis);
				session.setChatImageUrl(imageUrl);

				// Remove the "analyzing" message and add the result
				messages = messages.filter((m) => m.id !== analyzingMsgId);

				// Build analysis summary message
				const analysis = data.analysis as RoomAnalysis;
				const roomTypeLabel = session.translations.room_types[analysis.roomType] || analysis.roomType;

				let summaryMessage = session.language === 'es'
					? `**Analisis completado!**\n\nPuedo ver que es un(a) **${roomTypeLabel}** de aproximadamente **${analysis.dimensions.area.toFixed(0)}m²**.`
					: `**Analysis complete!**\n\nI can see this is a **${roomTypeLabel}** of approximately **${analysis.dimensions.area.toFixed(0)}m²**.`;

				if (analysis.windows.count > 0) {
					summaryMessage += session.language === 'es'
						? `\n- **${analysis.windows.count} ventana(s)** orientadas al ${analysis.windows.orientation}`
						: `\n- **${analysis.windows.count} window(s)** facing ${analysis.windows.orientation}`;
				}

				if (analysis.estimatedOccupancy > 0) {
					summaryMessage += session.language === 'es'
						? `\n- Capacidad estimada: **${analysis.estimatedOccupancy} personas**`
						: `\n- Estimated capacity: **${analysis.estimatedOccupancy} people**`;
				}

				if (analysis.insights && analysis.insights.length > 0) {
					summaryMessage += '\n\n';
					summaryMessage += analysis.insights.slice(0, 2).map(i => `> ${i}`).join('\n');
				}

				// Add follow-up question
				summaryMessage += '\n\n';
				summaryMessage += session.language === 'es'
					? '¿Cuantas personas usan normalmente este espacio?'
					: 'How many people normally use this space?';

				messages = [
					...messages,
					{
						id: crypto.randomUUID(),
						role: 'assistant',
						content: summaryMessage,
						timestamp: new Date()
					}
				];

				await scrollToBottom();
				return analysis;
			} else {
				// Show error message
				messages = messages.filter((m) => m.id !== analyzingMsgId);
				messages = [
					...messages,
					{
						id: crypto.randomUUID(),
						role: 'assistant',
						content: t.analysis?.error || 'Could not analyze the image. Please try another photo.',
						timestamp: new Date()
					}
				];
				return null;
			}
		} catch (error) {
			console.error('Image analysis error:', error);
			messages = messages.filter((m) => m.id !== analyzingMsgId);
			messages = [
				...messages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					content: t.analysis?.error || 'Could not analyze the image. Please try another photo.',
					timestamp: new Date()
				}
			];
			return null;
		} finally {
			isAnalyzingImage = false;
		}
	}

	// Generate quote using the chat-quote API
	async function generateQuote() {
		if (!session.chatAnalysis) return;

		isGeneratingQuote = true;
		await scrollToBottom();

		try {
			const response = await fetch('/api/chat-quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					analysis: session.chatAnalysis,
					userInputs: session.chatUserInputs,
					imageUrl: session.chatImageUrl
				})
			});

			const data = await response.json();

			if (data.success && data.quote) {
				session.setChatQuote(data.quote);

				// Add quote message
				messages = [
					...messages,
					{
						id: crypto.randomUUID(),
						role: 'assistant',
						content: '__QUOTE_CARD__',
						timestamp: new Date(),
						metadata: { quoteGenerated: true }
					}
				];
				await scrollToBottom();
			} else {
				messages = [
					...messages,
					{
						id: crypto.randomUUID(),
						role: 'assistant',
						content: session.language === 'es'
							? 'Hubo un error al generar la cotizacion. Por favor intenta de nuevo.'
							: 'There was an error generating the quote. Please try again.',
						timestamp: new Date()
					}
				];
			}
		} catch (error) {
			console.error('Quote generation error:', error);
			messages = [
				...messages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					content: session.translations.errors.network_error,
					timestamp: new Date()
				}
			];
		} finally {
			isGeneratingQuote = false;
			await scrollToBottom();
		}
	}

	// Download PDF
	async function downloadPdf() {
		if (!session.chatQuote) return;

		isGeneratingPdf = true;
		try {
			const { generateQuotePdf } = await import('$lib/components/pdf/generate-pdf');
			await generateQuotePdf(session.chatQuote, session.language);
		} catch (error) {
			console.error('PDF generation error:', error);
			alert(session.language === 'es' ? 'Error al generar PDF' : 'Error generating PDF');
		} finally {
			isGeneratingPdf = false;
		}
	}

	function openImagePicker() {
		fileInputRef?.click();
	}

	function clearPendingImage() {
		pendingImage = null;
	}

	function useSuggestion(suggestion: string) {
		inputValue = suggestion;
		sendMessage(suggestion);
	}

	function goBack() {
		goto('/');
	}
</script>

<div class="h-screen flex flex-col bg-background">
	<!-- Header -->
	<header class="glass border-b border-border px-4 py-3 flex-shrink-0">
		<div class="mx-auto max-w-2xl flex items-center justify-between">
			<button
				onclick={goBack}
				class="flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors rounded-lg px-2 py-1.5 hover:bg-surface"
			>
				<ArrowLeft class="h-5 w-5" />
				<span class="text-sm font-medium">{session.translations.app.back}</span>
			</button>

			<a
				href="https://www.trybotix.com"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:opacity-80 transition-opacity"
			>
				<img
					src="/trybotix-logo-white.png"
					alt="Trybotix Labs"
					class="h-10 sm:h-11"
				/>
			</a>

			<LanguageSwitcher />
		</div>
	</header>

	<!-- Messages -->
	<div bind:this={messagesContainer} class="flex-1 overflow-y-auto px-4 py-6">
		<div class="mx-auto max-w-2xl space-y-4">
			{#each messages as message}
				<div
					class={cn(
						'flex gap-3 animate-fade-in',
						message.role === 'user' ? 'flex-row-reverse' : ''
					)}
				>
					<!-- Avatar -->
					<div
						class={cn(
							'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0',
							message.role === 'user'
								? 'bg-gradient-to-br from-accent-500 to-orange-600'
								: 'bg-surface border border-border'
						)}
					>
						{#if message.role === 'user'}
							<User class="h-4 w-4 text-white" />
						{:else}
							<Bot class="h-4 w-4 text-foreground-muted" />
						{/if}
					</div>

					<!-- Message Bubble -->
					<div
						class={cn(
							'max-w-[85%] rounded-2xl',
							message.role === 'user'
								? 'bg-gradient-to-r from-accent-500 to-orange-600 text-white rounded-tr-sm px-4 py-3'
								: message.content === '__QUOTE_CARD__'
									? 'w-full max-w-sm overflow-hidden'
									: 'glass border border-border rounded-tl-sm px-4 py-3'
						)}
					>
						{#if message.imageUrl}
							<img
								src={message.imageUrl}
								alt="Uploaded"
								class="rounded-lg mb-2 max-w-full h-auto max-h-48 object-cover"
							/>
						{/if}
						{#if message.content === '__QUOTE_CARD__' && session.chatQuote}
							<!-- Render quote card -->
							<ChatQuoteCard
								quote={session.chatQuote}
								language={session.language}
								onDownloadPdf={downloadPdf}
								{isGeneratingPdf}
							/>
						{:else if message.role === 'assistant'}
							<div class="text-sm chat-message">
								<Markdown content={message.content} />
							</div>
						{:else}
							<p class="text-sm whitespace-pre-wrap">{message.content}</p>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Generate Quote Button (shown when ready and no quote yet) -->
			{#if session.chatReadyForQuote && !session.chatQuote && !isGeneratingQuote && !isLoading}
				<div class="flex gap-3 animate-fade-in">
					<div class="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0">
						<CheckCircle2 class="h-4 w-4 text-success" />
					</div>
					<div class="glass border border-accent-500/50 rounded-2xl rounded-tl-sm px-4 py-4 max-w-[85%]">
						<p class="text-sm text-foreground font-medium mb-2">
							{t.quote?.ready_title || (session.language === 'es' ? 'Tengo suficiente informacion!' : 'I have enough information!')}
						</p>
						<p class="text-xs text-foreground-muted mb-3">
							{t.quote?.ready_description || (session.language === 'es' ? 'Puedo generar tu cotizacion personalizada ahora.' : 'I can generate your personalized quote now.')}
						</p>
						<button
							onclick={generateQuote}
							class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-orange-600 text-white font-medium text-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all"
						>
							<Calculator class="h-4 w-4" />
							{t.quote?.generate_button || (session.language === 'es' ? 'Generar Cotizacion' : 'Generate Quote')}
						</button>
					</div>
				</div>
			{/if}

			<!-- Quote generation loading -->
			{#if isGeneratingQuote}
				<div class="flex gap-3 animate-fade-in">
					<div class="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0">
						<Bot class="h-4 w-4 text-foreground-muted" />
					</div>
					<div class="glass border border-border rounded-2xl rounded-tl-sm px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="h-5 w-5 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin"></div>
							<span class="text-sm text-foreground-muted">
								{t.generating_quote || (session.language === 'es' ? 'Generando tu cotizacion...' : 'Generating your quote...')}
							</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Streaming indicator -->
			{#if isLoading && streamingContent}
				<div class="flex gap-3 animate-fade-in">
					<div
						class="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0"
					>
						<Bot class="h-4 w-4 text-foreground-muted" />
					</div>
					<div
						class="max-w-[80%] glass border border-border rounded-2xl rounded-tl-sm px-4 py-3"
					>
						<div class="text-sm chat-message">
							<Markdown content={streamingContent} />
							<span class="inline-block w-2 h-4 bg-accent-500 animate-pulse ml-0.5"></span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Loading indicator (no content yet) -->
			{#if isLoading && !streamingContent}
				<div class="flex gap-3 animate-fade-in">
					<div
						class="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0"
					>
						<Bot class="h-4 w-4 text-foreground-muted" />
					</div>
					<div
						class="glass border border-border rounded-2xl rounded-tl-sm px-4 py-3"
					>
						<div class="flex gap-1.5">
							<div
								class="h-2 w-2 rounded-full bg-accent-500 animate-bounce"
								style="animation-delay: 0ms;"
							></div>
							<div
								class="h-2 w-2 rounded-full bg-accent-500 animate-bounce"
								style="animation-delay: 150ms;"
							></div>
							<div
								class="h-2 w-2 rounded-full bg-accent-500 animate-bounce"
								style="animation-delay: 300ms;"
							></div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Suggestions (only show when few messages) -->
			{#if messages.length <= 2 && !isLoading}
				<div class="pt-6">
					<p class="text-sm text-foreground-muted mb-3 flex items-center gap-2">
						<Sparkles class="h-4 w-4 text-accent-500" />
						{t.suggestions.title}
					</p>
					<div class="flex flex-wrap gap-2">
						{#each suggestions as suggestion}
							<button
								onclick={() => useSuggestion(suggestion)}
								class="text-sm px-4 py-2 rounded-full glass border border-border text-foreground-muted hover:text-foreground hover:border-accent-500/30 transition-all"
							>
								{suggestion}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Input Area -->
	<div class="border-t border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3 flex-shrink-0">
		<div class="mx-auto max-w-2xl">
			<!-- Pending Image Preview -->
			{#if pendingImage}
				<div class="mb-3 relative inline-block">
					<img
						src={pendingImage}
						alt="Preview"
						class="h-20 w-20 object-cover rounded-2xl border-2 border-accent-500/30 shadow-lg"
					/>
					<button
						onclick={clearPendingImage}
						class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border text-foreground flex items-center justify-center text-sm font-medium hover:bg-error hover:text-white hover:border-error transition-all shadow-md"
					>
						×
					</button>
				</div>
			{/if}

			<!-- Input Row - Modern unified container -->
			<div class="flex items-center gap-3 p-1.5 rounded-2xl bg-surface/60 border border-border/50 shadow-lg backdrop-blur-sm">
				<!-- Hidden File Input -->
				<input
					bind:this={fileInputRef}
					type="file"
					accept="image/*"
					onchange={handleImageSelect}
					class="hidden"
				/>

				<!-- Image Button -->
				<button
					onclick={openImagePicker}
					disabled={isLoading}
					class="h-11 w-11 rounded-xl bg-surface/80 hover:bg-accent-500/10 border border-transparent hover:border-accent-500/30 flex items-center justify-center transition-all duration-200 disabled:opacity-40 group"
					title={session.language === 'es' ? 'Subir imagen' : 'Upload image'}
				>
					<ImageIcon class="h-5 w-5 text-foreground-muted group-hover:text-accent-400 transition-colors" />
				</button>

				<!-- Text Input -->
				<div class="flex-1 min-w-0">
					<textarea
						bind:value={inputValue}
						onkeydown={handleKeydown}
						placeholder={t.placeholder}
						disabled={isLoading}
						rows="1"
						class="chat-input w-full bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle/60 resize-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed leading-relaxed"
					></textarea>
				</div>

				<!-- Send Button -->
				<button
					onclick={() => sendMessage()}
					disabled={isLoading || (!inputValue.trim() && !pendingImage)}
					class={cn(
						'h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300',
						inputValue.trim() || pendingImage
							? 'bg-gradient-to-r from-accent-500 to-orange-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/30 hover:scale-105 active:scale-95'
							: 'bg-surface/60 text-foreground-subtle/50',
						'disabled:cursor-not-allowed disabled:hover:scale-100'
					)}
				>
					<Send class="h-5 w-5" />
				</button>
			</div>

			<!-- Safe area padding for mobile -->
			<div class="h-safe-area-bottom"></div>
		</div>
	</div>
</div>

<style>
	/* Modern chat input styling */
	.chat-input {
		max-height: 120px;
		overflow-y: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
	}

	.chat-input::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	/* Safe area for iOS devices */
	.h-safe-area-bottom {
		height: env(safe-area-inset-bottom, 0px);
	}

	/* Chat message styling with proper contrast */
	.chat-message {
		color: #fafafa;
		line-height: 1.6;
	}

	.chat-message :global(p) {
		margin: 0.5em 0;
		color: #fafafa;
	}

	.chat-message :global(p:first-child) {
		margin-top: 0;
	}

	.chat-message :global(p:last-child) {
		margin-bottom: 0;
	}

	.chat-message :global(strong) {
		color: #fbbf24;
		font-weight: 600;
	}

	.chat-message :global(ul),
	.chat-message :global(ol) {
		margin: 0.5em 0;
		padding-left: 1.25em;
		color: #fafafa;
	}

	.chat-message :global(li) {
		margin: 0.25em 0;
	}

	.chat-message :global(code) {
		background: rgba(245, 158, 11, 0.15);
		color: #fbbf24;
		padding: 0.125em 0.375em;
		border-radius: 0.25em;
		font-size: 0.9em;
	}

	.chat-message :global(pre) {
		background: rgba(0, 0, 0, 0.3);
		padding: 0.75em 1em;
		border-radius: 0.5em;
		overflow-x: auto;
		margin: 0.75em 0;
	}

	.chat-message :global(pre code) {
		background: none;
		padding: 0;
		color: #fafafa;
	}

	.chat-message :global(a) {
		color: #fbbf24;
		text-decoration: underline;
	}

	.chat-message :global(blockquote) {
		border-left: 3px solid #f59e0b;
		padding-left: 1em;
		margin: 0.75em 0;
		color: #a1a1aa;
	}
</style>
