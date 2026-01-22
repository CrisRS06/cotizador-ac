<script lang="ts">
	import { cn } from '$lib/utils';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import { Camera, Image, Upload, X, Lightbulb } from 'lucide-svelte';
	import imageCompression from 'browser-image-compression';

	interface Props {
		onImageSelected: (file: File, base64: string, previewUrl: string) => void;
		class?: string;
	}

	let { onImageSelected, class: className = '' }: Props = $props();

	const session = getSessionContext();
	const t = session.translations.wizard.upload;

	let isDragging = $state(false);
	let isCompressing = $state(false);
	let previewUrl = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let cameraInputRef = $state<HTMLInputElement | null>(null);

	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];

	async function processFile(file: File) {
		errorMessage = null;

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
			errorMessage = session.translations.errors.invalid_format;
			return;
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			errorMessage = session.translations.errors.file_too_large;
			return;
		}

		try {
			isCompressing = true;

			// Compress image for better performance
			const compressedFile = await imageCompression(file, {
				maxSizeMB: 1,
				maxWidthOrHeight: 1920,
				useWebWorker: true,
				fileType: 'image/jpeg'
			});

			// Create preview URL
			const preview = URL.createObjectURL(compressedFile);
			previewUrl = preview;

			// Convert to base64
			const base64 = await fileToBase64(compressedFile);

			onImageSelected(compressedFile, base64, preview);
		} catch (error) {
			console.error('Image processing error:', error);
			errorMessage = session.translations.errors.upload_failed;
		} finally {
			isCompressing = false;
		}
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				// Remove data URL prefix
				const base64 = result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			processFile(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const file = event.dataTransfer?.files[0];
		if (file) {
			processFile(file);
		}
	}

	function openCamera() {
		cameraInputRef?.click();
	}

	function openGallery() {
		fileInputRef?.click();
	}

	function clearPreview() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		previewUrl = null;
		errorMessage = null;
	}
</script>

<div class={cn('space-y-6', className)}>
	<!-- Hidden file inputs -->
	<input
		bind:this={fileInputRef}
		type="file"
		accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
		onchange={handleFileInput}
		class="hidden"
	/>
	<input
		bind:this={cameraInputRef}
		type="file"
		accept="image/*"
		capture="environment"
		onchange={handleFileInput}
		class="hidden"
	/>

	{#if previewUrl}
		<!-- Image Preview -->
		<div class="relative rounded-2xl overflow-hidden border-2 border-accent-500/50 animate-scale-in glow-amber">
			<img
				src={previewUrl}
				alt="Vista previa"
				class="w-full h-64 object-cover"
			/>
			<button
				onclick={clearPreview}
				class="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-surface transition-colors border border-border"
				aria-label="Eliminar imagen"
			>
				<X class="h-5 w-5" />
			</button>
		</div>
	{:else}
		<!-- Upload Zone -->
		<div
			class={cn(
				'relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300',
				isDragging
					? 'border-accent-500 bg-accent-500/10 glow-amber'
					: 'border-border-subtle bg-surface hover:border-accent-500/50 hover:bg-surface-hover',
				isCompressing && 'pointer-events-none opacity-50'
			)}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
		>
			{#if isCompressing}
				<div class="flex flex-col items-center gap-3">
					<div class="h-12 w-12 rounded-full bg-accent-500/20 flex items-center justify-center">
						<svg class="h-6 w-6 animate-spin text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
					<p class="text-sm text-foreground-muted">
						{session.language === 'es' ? 'Procesando imagen...' : 'Processing image...'}
					</p>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3">
					<div class="h-16 w-16 rounded-full bg-accent-500/15 flex items-center justify-center">
						<Upload class="h-8 w-8 text-accent-500" />
					</div>
					<p class="text-foreground-muted">
						{t.cta_drop}
					</p>
					<p class="text-xs text-foreground-subtle">
						{t.supported_formats}
					</p>
				</div>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-3">
			<button
				onclick={openCamera}
				disabled={isCompressing}
				class={cn(
					'flex-1 flex items-center justify-center gap-2 rounded-xl py-4 font-medium transition-all',
					'bg-gradient-to-r from-accent-500 to-orange-600 text-white',
					'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
					'hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:-translate-y-0.5',
					'active:translate-y-0',
					'disabled:opacity-50 disabled:cursor-not-allowed'
				)}
			>
				<Camera class="h-5 w-5" />
				{t.cta_camera}
			</button>

			<button
				onclick={openGallery}
				disabled={isCompressing}
				class={cn(
					'flex-1 flex items-center justify-center gap-2 rounded-xl py-4 font-medium transition-all',
					'bg-surface text-foreground border border-border',
					'hover:bg-surface-hover hover:border-border-subtle',
					'disabled:opacity-50 disabled:cursor-not-allowed'
				)}
			>
				<Image class="h-5 w-5" />
				{t.cta_gallery}
			</button>
		</div>
	{/if}

	<!-- Error Message -->
	{#if errorMessage}
		<div class="rounded-xl bg-error/10 border border-error/30 p-4 text-sm text-error animate-scale-in">
			{errorMessage}
		</div>
	{/if}

	<!-- Tips -->
	{#if !previewUrl}
		<div class="glass-accent rounded-xl p-4">
			<div class="flex items-start gap-3">
				<div class="h-8 w-8 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0">
					<Lightbulb class="h-4 w-4 text-accent-400" />
				</div>
				<div>
					<h4 class="font-medium text-accent-400 mb-2">{t.tips.title}</h4>
					<ul class="text-sm text-foreground-muted space-y-1">
						<li class="flex items-start gap-2">
							<span class="text-accent-500 mt-1">•</span>
							<span>{t.tips.tip1}</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-accent-500 mt-1">•</span>
							<span>{t.tips.tip2}</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-accent-500 mt-1">•</span>
							<span>{t.tips.tip3}</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>
