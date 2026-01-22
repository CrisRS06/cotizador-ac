<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import AnalysisOverlay from '$lib/components/wizard/AnalysisOverlay.svelte';
	import AnalysisEditor from '$lib/components/wizard/AnalysisEditor.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowRight, Edit3, Sparkles, AlertTriangle } from 'lucide-svelte';
	import type { RoomAnalysis } from '$lib/types';

	const session = getSessionContext();
	const t = session.translations.wizard.analysis;

	let isAnalyzing = $state(true);
	let analysisError = $state<string | null>(null);
	let showInsights = $state(false);
	let isEditing = $state(false);

	onMount(async () => {
		if (!session.imageBase64) {
			goto('/wizard/upload');
			return;
		}

		await analyzeRoom();
	});

	async function analyzeRoom() {
		isAnalyzing = true;
		analysisError = null;

		try {
			const response = await fetch('/api/analyze-room', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					imageBase64: session.imageBase64,
					language: session.language
				})
			});

			const data = await response.json();

			if (data.success && data.analysis) {
				session.setAnalysis(data.analysis);
				// Show insights after a delay
				setTimeout(() => (showInsights = true), 2500);
			} else {
				analysisError = data.error || session.translations.errors.analysis_failed;
			}
		} catch (error) {
			console.error('Analysis error:', error);
			analysisError = session.translations.errors.network_error;
		} finally {
			isAnalyzing = false;
		}
	}

	function proceed() {
		session.setStep('questions');
		goto('/wizard/questions');
	}

	function retryAnalysis() {
		analyzeRoom();
	}

	function startEditing() {
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	function saveEdits(updated: RoomAnalysis) {
		session.setAnalysis(updated);
		isEditing = false;
	}
</script>

<div class="space-y-6 animate-fade-in">
	<!-- Title -->
	<div class="text-center">
		<h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-2">
			{isAnalyzing ? t.title : t.complete}
		</h1>
	</div>

	<!-- Analysis Overlay -->
	{#if session.imageUrl}
		<AnalysisOverlay
			imageUrl={session.imageUrl}
			analysis={session.analysis ?? null}
			{isAnalyzing}
		/>
	{/if}

	<!-- Error State -->
	{#if analysisError}
		<div class="card bg-error/10 border-error/30 animate-scale-in">
			<div class="flex items-start gap-3">
				<div class="h-10 w-10 rounded-xl bg-error/20 flex items-center justify-center flex-shrink-0">
					<AlertTriangle class="h-5 w-5 text-error" />
				</div>
				<div>
					<p class="text-sm text-error mb-3">{analysisError}</p>
					<Button variant="secondary" size="sm" onclick={retryAnalysis}>
						{session.translations.app.retry}
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Insights Section -->
	{#if session.analysis && showInsights && session.analysis.insights.length > 0 && !isEditing}
		<div class="card glass-accent animate-slide-up">
			<div class="flex items-start gap-3">
				<div
					class="h-10 w-10 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0"
				>
					<Sparkles class="h-5 w-5 text-accent-400" />
				</div>
				<div>
					<h3 class="font-semibold text-foreground mb-3">
						{session.language === 'es' ? 'Hallazgos importantes' : 'Key findings'}
					</h3>
					<ul class="space-y-2">
						{#each session.analysis.insights as insight, i}
							<li
								class="text-sm text-foreground-muted flex items-start gap-2 animate-fade-in"
								style="animation-delay: {i * 100}ms;"
							>
								<span class="text-accent-500 mt-0.5">•</span>
								<span>{insight}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/if}

	<!-- Editor Mode -->
	{#if session.analysis && isEditing}
		<AnalysisEditor analysis={session.analysis} onSave={saveEdits} onCancel={cancelEditing} />
	{/if}

	<!-- Detected Values Summary (when not editing) -->
	{#if session.analysis && !isAnalyzing && !isEditing}
		<div class="card animate-slide-up" style="animation-delay: 200ms;">
			<h3 class="font-semibold text-foreground mb-4">
				{session.language === 'es' ? 'Valores detectados' : 'Detected values'}
			</h3>

			<div class="grid grid-cols-2 gap-4 text-sm">
				<div class="space-y-1">
					<span class="text-foreground-subtle">{t.detected.dimensions}:</span>
					<p class="font-semibold text-foreground">
						{session.analysis.dimensions.area.toFixed(1)} m²
					</p>
					<p class="text-xs text-foreground-muted">
						{session.analysis.dimensions.width.toFixed(1)} × {session.analysis.dimensions.length.toFixed(
							1
						)} × {session.analysis.dimensions.height.toFixed(1)}m
					</p>
				</div>
				<div class="space-y-1">
					<span class="text-foreground-subtle">{t.detected.windows}:</span>
					<p class="font-semibold text-foreground">
						{session.analysis.windows.count}
						({session.analysis.windows.orientation})
					</p>
					{#if session.analysis.windows.hasSolarFilm}
						<p class="text-xs text-success">
							{session.language === 'es' ? 'Con pelicula solar' : 'With solar film'}
						</p>
					{/if}
				</div>
				<div class="space-y-1">
					<span class="text-foreground-subtle">{t.detected.room_type}:</span>
					<p class="font-semibold text-foreground">
						{session.translations.room_types[
							session.analysis.roomType as keyof typeof session.translations.room_types
						]}
					</p>
				</div>
				<div class="space-y-1">
					<span class="text-foreground-subtle">{t.detected.ceiling}:</span>
					<p class="font-semibold text-foreground capitalize">
						{session.analysis.ceilingType}
						{#if session.analysis.dimensions.height > 3}
							({session.analysis.dimensions.height.toFixed(1)}m)
						{/if}
					</p>
				</div>
				{#if session.analysis.hasDirectSunlight}
					<div class="col-span-2">
						<span class="text-orange-400 text-sm flex items-center gap-2">
							<span class="text-lg">☀️</span>
							{session.language === 'es' ? 'Recibe sol directo' : 'Receives direct sunlight'}
						</span>
					</div>
				{/if}
			</div>

			<!-- Edit Button -->
			<button
				onclick={startEditing}
				class="mt-4 text-sm text-accent-500 hover:text-accent-400 flex items-center gap-1.5 font-medium transition-colors"
			>
				<Edit3 class="h-4 w-4" />
				{t.edit_values}
			</button>
		</div>
	{/if}

	<!-- Continue Button -->
	{#if session.analysis && !isAnalyzing && !analysisError && !isEditing}
		<div class="animate-slide-up" style="animation-delay: 300ms;">
			<Button variant="primary" size="lg" onclick={proceed} class="w-full">
				{t.confirm}
				<ArrowRight class="h-5 w-5" />
			</Button>
		</div>
	{/if}
</div>
