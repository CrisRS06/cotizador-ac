<script lang="ts">
	import type { RoomAnalysis } from '$lib/types';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import {
		Ruler,
		LayoutGrid,
		Sun,
		Wind,
		Users,
		Home,
		Maximize2
	} from 'lucide-svelte';

	interface Props {
		imageUrl: string;
		analysis: RoomAnalysis | null;
		isAnalyzing: boolean;
	}

	let { imageUrl, analysis, isAnalyzing }: Props = $props();

	const session = getSessionContext();
	const t = session.translations.wizard.analysis;
	const roomTypes = session.translations.room_types;

	// Animation states
	let showDimensions = $state(false);
	let showWindows = $state(false);
	let showRoomType = $state(false);
	let showCeiling = $state(false);
	let showSunlight = $state(false);

	// Reveal animation sequence
	$effect(() => {
		if (analysis) {
			setTimeout(() => (showDimensions = true), 200);
			setTimeout(() => (showWindows = true), 600);
			setTimeout(() => (showRoomType = true), 1000);
			setTimeout(() => (showCeiling = true), 1400);
			setTimeout(() => (showSunlight = true), 1800);
		}
	});

	function getRoomTypeName(type: string): string {
		return roomTypes[type as keyof typeof roomTypes] || type;
	}
</script>

<div class="relative rounded-2xl overflow-hidden bg-background border border-border">
	<!-- Image -->
	<img src={imageUrl} alt="Espacio a analizar" class="w-full h-72 object-cover" />

	<!-- Scanning Animation Overlay -->
	{#if isAnalyzing}
		<div class="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
			<!-- Scanning line animation -->
			<div class="absolute inset-0 overflow-hidden">
				<div
					class="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-400 to-transparent animate-scan"
				></div>
			</div>

			<!-- Grid overlay for tech effect -->
			<div
				class="absolute inset-0 opacity-20"
				style="background-image: linear-gradient(rgba(245,158,11,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.1) 1px, transparent 1px); background-size: 20px 20px;"
			></div>

			<!-- Status text -->
			<div class="text-center text-foreground z-10">
				<div
					class="h-16 w-16 mx-auto mb-4 rounded-2xl glass-accent flex items-center justify-center animate-pulse-glow"
				>
					<svg
						class="h-8 w-8 animate-spin text-accent-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
				<p class="text-sm font-medium text-foreground">{t.title}</p>
				<p class="text-xs text-foreground-muted mt-1">Grok 4.1 Fast</p>
			</div>
		</div>
	{/if}

	<!-- Analysis Markers -->
	{#if analysis && !isAnalyzing}
		<!-- Dimensions marker - top left -->
		{#if showDimensions}
			<div class="absolute top-3 left-3 animate-bounce-in">
				<div
					class="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-accent-500/30"
				>
					<div class="h-8 w-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
						<Ruler class="h-4 w-4 text-accent-400" />
					</div>
					<div class="text-sm">
						<div class="font-semibold text-foreground">
							{analysis.dimensions.area.toFixed(1)}m²
						</div>
						<div class="text-xs text-foreground-muted">
							{analysis.dimensions.width.toFixed(1)}×{analysis.dimensions.length.toFixed(1)}m
						</div>
					</div>
				</div>
				<!-- Connection line -->
				<div
					class="absolute top-full left-4 w-px h-8 bg-gradient-to-b from-accent-500/50 to-transparent"
				></div>
			</div>
		{/if}

		<!-- Windows marker - top right -->
		{#if showWindows && analysis.windows.count > 0}
			<div class="absolute top-3 right-3 animate-bounce-in" style="animation-delay: 100ms;">
				<div class="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-info/30">
					<div class="h-8 w-8 rounded-lg bg-info/20 flex items-center justify-center">
						<LayoutGrid class="h-4 w-4 text-info" />
					</div>
					<div class="text-sm">
						<div class="font-semibold text-foreground">
							{analysis.windows.count}
							{session.language === 'es' ? 'ventanas' : 'windows'}
						</div>
						<div class="text-xs text-foreground-muted">
							{analysis.windows.orientation.toUpperCase()}
							{analysis.windows.hasSolarFilm
								? ''
								: session.language === 'es'
									? '(sin film)'
									: '(no film)'}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Room type marker - bottom left -->
		{#if showRoomType}
			<div class="absolute bottom-3 left-3 animate-bounce-in" style="animation-delay: 200ms;">
				<div
					class="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-success/30"
				>
					<div class="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
						<Home class="h-4 w-4 text-success" />
					</div>
					<div class="text-sm">
						<div class="font-semibold text-foreground">
							{getRoomTypeName(analysis.roomType)}
						</div>
						<div class="text-xs text-foreground-muted">
							{analysis.estimatedOccupancy}
							{session.language === 'es' ? 'ocupantes' : 'occupants'}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Ceiling height marker -->
		{#if showCeiling && analysis.ceilingType !== 'standard'}
			<div class="absolute bottom-16 left-3 animate-bounce-in" style="animation-delay: 300ms;">
				<div
					class="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-warning/30"
				>
					<div class="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center">
						<Maximize2 class="h-4 w-4 text-warning" />
					</div>
					<div class="text-sm text-foreground">
						{session.language === 'es' ? 'Techo alto' : 'High ceiling'}
						<span class="text-xs text-foreground-muted">
							({analysis.dimensions.height.toFixed(1)}m)
						</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Sunlight marker - bottom right -->
		{#if showSunlight && analysis.hasDirectSunlight}
			<div class="absolute bottom-3 right-3 animate-bounce-in" style="animation-delay: 400ms;">
				<div
					class="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-orange-500/30"
				>
					<div class="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
						<Sun class="h-4 w-4 text-orange-400" />
					</div>
					<div class="text-sm text-foreground">
						{session.language === 'es' ? 'Sol directo' : 'Direct sunlight'}
					</div>
				</div>
			</div>
		{/if}

		<!-- Confidence indicator -->
		<div
			class="absolute top-1/2 right-3 -translate-y-1/2 animate-fade-in"
			style="animation-delay: 2s;"
		>
			<div class="glass rounded-full px-3 py-1.5 border border-accent-500/30">
				<span class="text-xs font-semibold gradient-text">
					{Math.round(analysis.confidenceScore * 100)}%
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes scan {
		0% {
			top: 0;
		}
		100% {
			top: 100%;
		}
	}

	.animate-scan {
		animation: scan 2s ease-in-out infinite;
	}
</style>
