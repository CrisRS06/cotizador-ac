<script lang="ts">
	import { getSessionContext } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import {
		Download,
		Star,
		DollarSign,
		Award,
		Zap,
		Check,
		ChevronDown,
		ChevronUp,
		ArrowRight
	} from 'lucide-svelte';
	import type { Quote, QuoteOption, Language } from '$lib/types';

	interface Props {
		quote: Quote;
		language: Language;
		onDownloadPdf?: () => void;
		isGeneratingPdf?: boolean;
	}

	let { quote, language, onDownloadPdf, isGeneratingPdf = false }: Props = $props();

	const session = getSessionContext();
	const t = session.translations.wizard.quote;

	let expandedOption = $state<string | null>(null);

	function getTierIcon(tier: string) {
		switch (tier) {
			case 'economic':
				return DollarSign;
			case 'recommended':
				return Star;
			case 'premium':
				return Award;
			default:
				return Zap;
		}
	}

	function getTierInfo(tier: string): { title: string; description: string } {
		const tiers: Record<string, { title: string; description: string }> = {
			economic: { title: t.economic.title, description: t.economic.description },
			recommended: { title: t.recommended.title, description: t.recommended.description },
			premium: { title: t.premium.title, description: t.premium.description }
		};
		return tiers[tier] || { title: tier, description: '' };
	}

	function formatPrice(min: number, max: number): string {
		return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
	}

	function toggleExpand(optionId: string) {
		expandedOption = expandedOption === optionId ? null : optionId;
	}
</script>

<div class="space-y-3">
	<!-- Header with total BTU -->
	<div class="bg-gradient-to-r from-accent-500 to-orange-600 rounded-xl p-4 text-white">
		<p class="text-sm opacity-90">{language === 'es' ? 'Carga termica calculada' : 'Calculated thermal load'}</p>
		<p class="text-2xl font-bold">{quote.calculation.totalBtu.toLocaleString()} BTU</p>
		<p class="text-sm opacity-90">{quote.calculation.tonnage.toFixed(1)} TR</p>
	</div>

	<!-- Quote Options -->
	{#each quote.options as option}
		{@const Icon = getTierIcon(option.tier)}
		{@const isExpanded = expandedOption === option.id}
		<div
			class={cn(
				'rounded-xl border transition-all duration-200',
				option.isRecommended
					? 'border-accent-500 bg-accent-500/10'
					: 'border-border bg-surface/50'
			)}
		>
			<!-- Option Header (always visible) -->
			<button
				onclick={() => toggleExpand(option.id)}
				class="w-full text-left p-4"
			>
				<div class="flex items-center gap-3">
					<div
						class={cn(
							'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
							option.tier === 'economic'
								? 'bg-foreground-subtle/10'
								: option.tier === 'recommended'
									? 'bg-accent-500/20'
									: 'bg-warning/20'
						)}
					>
						<Icon
							class={cn(
								'h-5 w-5',
								option.tier === 'economic'
									? 'text-foreground-subtle'
									: option.tier === 'recommended'
										? 'text-accent-400'
										: 'text-warning'
							)}
						/>
					</div>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-semibold text-foreground">
								{getTierInfo(option.tier).title}
							</span>
							{#if option.isRecommended}
								<span class="text-[10px] bg-accent-500 text-white px-2 py-0.5 rounded-full font-medium">
									{t.recommended.badge}
								</span>
							{/if}
						</div>
						<p class="text-sm text-foreground-muted truncate">
							{option.units[0]?.brand} {option.units[0]?.model}
						</p>
					</div>

					<div class="text-right flex-shrink-0">
						<p class="font-bold text-foreground">
							{formatPrice(option.estimatedPrice.min, option.estimatedPrice.max)}
						</p>
						<div class="flex items-center justify-end gap-1 text-foreground-subtle">
							{#if isExpanded}
								<ChevronUp class="h-4 w-4" />
							{:else}
								<ChevronDown class="h-4 w-4" />
							{/if}
						</div>
					</div>
				</div>
			</button>

			<!-- Expanded Details -->
			{#if isExpanded}
				<div class="px-4 pb-4 pt-0 animate-fade-in border-t border-border/50">
					<!-- Specs Grid -->
					<div class="grid grid-cols-2 gap-2 mt-3 text-sm">
						<div>
							<span class="text-foreground-subtle">{t.specs.capacity}:</span>
							<span class="font-medium text-foreground ml-1">{option.totalBtu.toLocaleString()} BTU</span>
						</div>
						<div>
							<span class="text-foreground-subtle">{t.specs.coverage}:</span>
							<span class="font-medium text-foreground ml-1">{option.coveragePercentage}%</span>
						</div>
						<div>
							<span class="text-foreground-subtle">{t.specs.monthly_cost}:</span>
							<span class="font-medium text-foreground ml-1">${option.estimatedMonthlyCost}</span>
						</div>
						<div>
							<span class="text-foreground-subtle">{t.specs.efficiency}:</span>
							<span class="font-medium text-foreground ml-1">SEER {option.units[0]?.seer || '-'}</span>
						</div>
					</div>

					<!-- Pros -->
					<div class="mt-3">
						<p class="text-xs font-semibold text-success mb-1.5 uppercase tracking-wider">
							{language === 'es' ? 'Ventajas' : 'Pros'}
						</p>
						<ul class="space-y-1">
							{#each (language === 'es' ? option.prosEs : option.pros).slice(0, 3) as pro}
								<li class="text-xs text-foreground-muted flex items-start gap-1.5">
									<Check class="h-3 w-3 text-success flex-shrink-0 mt-0.5" />
									{pro}
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Download PDF Button -->
	{#if onDownloadPdf}
		<button
			onclick={onDownloadPdf}
			disabled={isGeneratingPdf}
			class={cn(
				'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all',
				'bg-gradient-to-r from-accent-500 to-orange-600 text-white',
				'hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
				'disabled:opacity-50 disabled:cursor-not-allowed'
			)}
		>
			{#if isGeneratingPdf}
				<div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
				{language === 'es' ? 'Generando...' : 'Generating...'}
			{:else}
				<Download class="h-5 w-5" />
				{t.download_pdf}
			{/if}
		</button>
	{/if}

	<!-- Disclaimer -->
	<p class="text-[10px] text-center text-foreground-subtle">
		{t.disclaimer}
	</p>

	<!-- CTA: Bridge to Trybotix -->
	<div class="mt-4 p-4 rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/30">
		<div class="flex justify-center mb-2">
			<img
				src="/trybotix-logo-white.png"
				alt="Trybotix Labs"
				class="h-10"
			/>
		</div>
		<p class="text-xs text-center text-foreground-muted mb-3">
			{language === 'es'
				? '¿Tienes un proceso que podria funcionar asi?'
				: 'Have a process that could work like this?'}
		</p>
		<a
			href="https://www.trybotix.com"
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center justify-center gap-2 text-xs font-medium text-[#22d3ee] hover:text-[#06b6d4] transition-colors"
		>
			{language === 'es' ? 'Conocer mas' : 'Learn more'}
			<ArrowRight class="h-3 w-3" />
		</a>
	</div>
</div>
