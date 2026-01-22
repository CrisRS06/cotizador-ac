<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowRight, Zap, Building2, Users, Wind, Shield } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { formatBtu, formatTonnage, groupBreakdownItems } from '$lib/services/thermal-calc';
	import type { ThermalCalculation, UserInputs, CalculationBreakdown } from '$lib/types';

	const session = getSessionContext();
	const t = session.translations.wizard.calculation;

	let isCalculating = $state(true);
	let showTotal = $state(false);
	let revealedGroups = $state<string[]>([]);
	let calculationError = $state<string | null>(null);

	// Group labels
	const groupLabels = {
		envelope: {
			en: 'Envelope Loads',
			es: 'Cargas de Envolvente',
			icon: Building2
		},
		internal: {
			en: 'Internal Loads',
			es: 'Cargas Internas',
			icon: Users
		},
		ventilation: {
			en: 'Ventilation & Infiltration',
			es: 'Ventilacion e Infiltracion',
			icon: Wind
		},
		other: {
			en: 'Other Factors',
			es: 'Otros Factores',
			icon: Shield
		}
	};

	onMount(async () => {
		if (!session.analysis) {
			goto('/wizard/upload');
			return;
		}

		await performCalculation();
	});

	async function performCalculation() {
		isCalculating = true;
		calculationError = null;

		try {
			const response = await fetch('/api/calculate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					analysis: session.analysis,
					userInputs: session.userInputs
				})
			});

			const data = await response.json();

			if (data.success && data.calculation) {
				session.setCalculation(data.calculation);

				// Create quote with options
				session.setQuote({
					id: crypto.randomUUID(),
					createdAt: new Date(),
					analysis: session.analysis!,
					userInputs: session.userInputs as UserInputs,
					calculation: data.calculation,
					options: data.options || [],
					imageUrl: session.imageUrl
				});

				// Animate the reveal
				await animateReveal(data.calculation);
			} else {
				calculationError = data.error || session.translations.errors.calculation_failed;
			}
		} catch (error) {
			console.error('Calculation error:', error);
			calculationError = session.translations.errors.network_error;
		} finally {
			isCalculating = false;
		}
	}

	async function animateReveal(calc: ThermalCalculation) {
		const groups = ['envelope', 'internal', 'ventilation', 'other'];

		// Reveal each group one by one
		for (const group of groups) {
			await new Promise((resolve) => setTimeout(resolve, 500));
			revealedGroups = [...revealedGroups, group];
		}

		// Show total after all groups
		await new Promise((resolve) => setTimeout(resolve, 500));
		showTotal = true;
	}

	function proceed() {
		session.setStep('quote');
		goto('/wizard/quote');
	}

	function formatNumber(num: number): string {
		return num.toLocaleString(session.language === 'es' ? 'es-ES' : 'en-US');
	}

	function getGroupTotal(items: CalculationBreakdown[]): number {
		return items.reduce((sum, item) => sum + item.value, 0);
	}
</script>

<div class="space-y-6 animate-fade-in">
	<!-- Title -->
	<div class="text-center">
		<h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-2">
			{isCalculating
				? t.title
				: session.language === 'es'
					? 'Calculo Profesional'
					: 'Professional Calculation'}
		</h1>
		<p class="text-sm text-foreground-muted">
			{session.language === 'es' ? 'Metodologia ASHRAE/ACCA' : 'ASHRAE/ACCA Methodology'}
		</p>
	</div>

	<!-- Calculation Animation -->
	{#if isCalculating && !session.calculation}
		<div class="card">
			<div class="flex flex-col items-center py-10">
				<div
					class="h-20 w-20 rounded-2xl glass-accent flex items-center justify-center mb-6 animate-pulse-glow"
				>
					<Zap class="h-10 w-10 text-accent-400" />
				</div>
				<p class="text-foreground-muted mb-4">{t.title}</p>
				<div class="w-full max-w-xs">
					<div class="h-2 bg-surface rounded-full overflow-hidden">
						<div
							class="h-full bg-gradient-to-r from-accent-500 to-orange-500 rounded-full animate-progress"
						></div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error State -->
	{#if calculationError}
		<div class="card bg-error/10 border-error/30">
			<p class="text-sm text-error mb-3">{calculationError}</p>
			<Button variant="secondary" size="sm" onclick={performCalculation}>
				{session.translations.app.retry}
			</Button>
		</div>
	{/if}

	<!-- Grouped Calculation Breakdown -->
	{#if session.calculation && revealedGroups.length > 0}
		{@const grouped = groupBreakdownItems(session.calculation.breakdown)}

		{#each Object.entries(grouped) as [groupKey, items]}
			{#if revealedGroups.includes(groupKey) && items.length > 0}
				{@const groupInfo = groupLabels[groupKey as keyof typeof groupLabels]}
				{@const GroupIcon = groupInfo.icon}

				<div class="card animate-slide-up">
					<!-- Group Header -->
					<div class="flex items-center gap-3 mb-4 pb-4 border-b border-border">
						<div class="h-12 w-12 rounded-xl bg-accent-500/15 flex items-center justify-center">
							<GroupIcon class="h-6 w-6 text-accent-400" />
						</div>
						<div class="flex-1">
							<h3 class="font-semibold text-foreground">
								{session.language === 'es' ? groupInfo.es : groupInfo.en}
							</h3>
						</div>
						<div class="text-right">
							<p class="font-bold gradient-text text-lg">
								+{formatNumber(getGroupTotal(items))}
							</p>
							<p class="text-xs text-foreground-subtle">BTU/h</p>
						</div>
					</div>

					<!-- Group Items -->
					<div class="space-y-2">
						{#each items as item, i}
							<div
								class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface-hover animate-fade-in"
								style="animation-delay: {i * 50}ms;"
							>
								<div class="flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-accent-500"></div>
									<div>
										<p class="text-sm font-medium text-foreground">
											{session.language === 'es' ? item.categoryEs : item.category}
										</p>
										<p class="text-xs text-foreground-muted">
											{session.language === 'es' ? item.descriptionEs : item.description}
										</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-semibold text-foreground">
										+{formatNumber(item.value)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{/if}

	<!-- Total Result -->
	{#if showTotal && session.calculation}
		<div
			class="card gradient-bg text-white animate-scale-in glow-amber-lg"
		>
			<div class="text-center py-6">
				<p class="text-sm text-white/70 mb-2">{t.total}</p>
				<p class="text-5xl font-bold mb-2">
					{formatBtu(session.calculation.totalBtu)}
				</p>
				<p class="text-white/70">
					{t.equivalent}
					<span class="font-semibold text-white">{formatTonnage(session.calculation.tonnage)}</span
					>
				</p>
			</div>

			<!-- Mini breakdown summary -->
			<div class="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-white/60">
						{session.language === 'es' ? 'Carga Sensible' : 'Sensible Load'}
					</p>
					<p class="font-semibold">
						{formatNumber(
							(session.calculation.envelopeLoads?.total || 0) +
								(session.calculation.internalLoads?.total || 0) +
								(session.calculation.ventilationLoads?.total || 0)
						)} BTU
					</p>
				</div>
				<div>
					<p class="text-white/60">
						{session.language === 'es' ? 'Carga Latente' : 'Latent Load'}
					</p>
					<p class="font-semibold">
						{formatNumber(session.calculation.latentLoad || 0)} BTU
					</p>
				</div>
			</div>
		</div>

		<!-- Continue Button -->
		<Button variant="primary" size="lg" onclick={proceed} class="w-full">
			{session.language === 'es' ? 'Ver opciones de equipos' : 'See equipment options'}
			<ArrowRight class="h-5 w-5" />
		</Button>
	{/if}
</div>

<style>
	@keyframes progress {
		0% {
			width: 0%;
		}
		100% {
			width: 100%;
		}
	}

	.animate-progress {
		animation: progress 3s ease-out forwards;
	}
</style>
