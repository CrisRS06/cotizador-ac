<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils';
	import {
		Download,
		Share2,
		Check,
		Star,
		Zap,
		DollarSign,
		Award,
		ArrowRight,
		MessageCircle,
		Mail
	} from 'lucide-svelte';
	import type { QuoteOption } from '$lib/types';

	const session = getSessionContext();
	const t = session.translations.wizard.quote;
	const cta = session.translations.cta;

	let selectedOption = $state<string | null>(null);
	let isGeneratingPdf = $state(false);

	onMount(() => {
		if (!session.quote) {
			goto('/wizard/upload');
			return;
		}
		// Auto-select recommended option
		const recommended = session.quote.options.find((o) => o.isRecommended);
		if (recommended) {
			selectedOption = recommended.id;
		}
	});

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

	function getTierStyles(tier: string, isSelected: boolean) {
		if (isSelected) {
			return 'border-accent-500 ring-2 ring-accent-500/30 bg-surface';
		}
		switch (tier) {
			case 'recommended':
				return 'border-accent-500/50 bg-accent-500/5';
			default:
				return 'border-border bg-surface hover:border-border-subtle';
		}
	}

	function formatPrice(min: number, max: number): string {
		return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
	}

	async function downloadPdf() {
		isGeneratingPdf = true;
		try {
			// Dynamic import for PDF generation
			const { generateQuotePdf } = await import('$lib/components/pdf/generate-pdf');
			await generateQuotePdf(session.quote!, session.language);
		} catch (error) {
			console.error('PDF generation error:', error);
			alert(session.language === 'es' ? 'Error al generar PDF' : 'Error generating PDF');
		} finally {
			isGeneratingPdf = false;
		}
	}

	function shareWhatsApp() {
		const text =
			session.language === 'es'
				? `Mira mi cotizacion de aire acondicionado generada con IA! Necesito ${session.calculation?.totalBtu.toLocaleString()} BTU para mi espacio.`
				: `Check out my AI-generated AC quote! I need ${session.calculation?.totalBtu.toLocaleString()} BTU for my space.`;
		const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
		window.open(url, '_blank');
	}

</script>

<div class="space-y-6 animate-fade-in">
	<!-- Title -->
	<div class="text-center">
		<h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-2">
			{t.title}
		</h1>
		<p class="text-foreground-muted">
			{t.subtitle}
		</p>
	</div>

	<!-- Quote Options -->
	{#if session.quote?.options}
		<div class="space-y-4">
			{#each session.quote.options as option, index}
				{@const Icon = getTierIcon(option.tier)}
				{@const isRecommended = option.tier === 'recommended'}
				<button
					onclick={() => (selectedOption = option.id)}
					class={cn(
						'w-full text-left card relative overflow-hidden transition-all duration-300',
						'border-2',
						getTierStyles(option.tier, selectedOption === option.id),
						isRecommended && 'scale-[1.02]',
						selectedOption === option.id && 'glow-amber'
					)}
					style="animation-delay: {index * 100}ms;"
				>
					<!-- Recommended Badge -->
					{#if option.isRecommended}
						<div
							class="absolute top-0 right-0 bg-gradient-to-r from-accent-500 to-orange-600 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl"
						>
							{t.recommended.badge}
						</div>
					{/if}

					<div class="flex items-start gap-4">
						<!-- Icon -->
						<div
							class={cn(
								'h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0',
								option.tier === 'economic'
									? 'bg-foreground-subtle/10'
									: option.tier === 'recommended'
										? 'bg-accent-500/20'
										: 'bg-warning/20'
							)}
						>
							<Icon
								class={cn(
									'h-7 w-7',
									option.tier === 'economic'
										? 'text-foreground-subtle'
										: option.tier === 'recommended'
											? 'text-accent-400'
											: 'text-warning'
								)}
							/>
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<h3 class="font-semibold text-foreground text-lg">
									{getTierInfo(option.tier).title}
								</h3>
								{#if selectedOption === option.id}
									<div class="h-5 w-5 rounded-full bg-accent-500 flex items-center justify-center">
										<Check class="h-3 w-3 text-white" />
									</div>
								{/if}
							</div>

							<p class="text-sm text-foreground-muted mb-4">
								{getTierInfo(option.tier).description}
							</p>

							<!-- Specs -->
							<div class="grid grid-cols-2 gap-3 text-sm">
								<div>
									<span class="text-foreground-subtle">{t.specs.capacity}:</span>
									<span class="font-medium text-foreground ml-1"
										>{option.totalBtu.toLocaleString()} BTU</span
									>
								</div>
								<div>
									<span class="text-foreground-subtle">{t.specs.coverage}:</span>
									<span class="font-medium text-foreground ml-1"
										>{option.coveragePercentage}%</span
									>
								</div>
								<div>
									<span class="text-foreground-subtle">{t.specs.monthly_cost}:</span>
									<span class="font-medium text-foreground ml-1"
										>${option.estimatedMonthlyCost}</span
									>
								</div>
								<div>
									<span class="text-foreground-subtle">{t.specs.efficiency}:</span>
									<span class="font-medium text-foreground ml-1"
										>SEER {option.units[0]?.seer || '-'}</span
									>
								</div>
							</div>

							<!-- Units -->
							<div class="mt-4 pt-4 border-t border-border">
								{#each option.units as unit}
									<p class="text-sm font-semibold text-foreground">
										{unit.brand} {unit.model}
									</p>
								{/each}
							</div>

							<!-- Price -->
							<div class="mt-4 flex items-center justify-between">
								<span class="text-xl font-bold gradient-text">
									{formatPrice(option.estimatedPrice.min, option.estimatedPrice.max)}
								</span>
								<span class="text-xs text-foreground-subtle">
									{option.estimatedPrice.installationIncluded ? t.included : t.not_included}
								</span>
							</div>
						</div>
					</div>

					<!-- Pros/Cons -->
					{#if selectedOption === option.id}
						<div class="mt-5 pt-5 border-t border-border animate-slide-up">
							<div class="grid grid-cols-2 gap-6">
								<div>
									<p class="text-xs font-semibold text-success mb-2 uppercase tracking-wider">
										{session.language === 'es' ? 'Ventajas' : 'Pros'}
									</p>
									<ul class="space-y-1.5">
										{#each session.language === 'es' ? option.prosEs : option.pros as pro}
											<li class="text-xs text-foreground-muted flex items-start gap-1.5">
												<Check class="h-3 w-3 text-success flex-shrink-0 mt-0.5" />
												{pro}
											</li>
										{/each}
									</ul>
								</div>
								<div>
									<p class="text-xs font-semibold text-error mb-2 uppercase tracking-wider">
										{session.language === 'es' ? 'Consideraciones' : 'Cons'}
									</p>
									<ul class="space-y-1.5">
										{#each session.language === 'es' ? option.consEs : option.cons as con}
											<li class="text-xs text-foreground-muted flex items-start gap-1.5">
												<span class="text-error">-</span>
												{con}
											</li>
										{/each}
									</ul>
								</div>
							</div>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Action Buttons -->
	<div class="space-y-3">
		<Button
			variant="primary"
			size="lg"
			onclick={downloadPdf}
			loading={isGeneratingPdf}
			class="w-full"
		>
			<Download class="h-5 w-5" />
			{t.download_pdf}
		</Button>

		<Button variant="secondary" onclick={shareWhatsApp} class="w-full">
			<Share2 class="h-4 w-4" />
			{session.language === 'es' ? 'Compartir por WhatsApp' : 'Share via WhatsApp'}
		</Button>
	</div>

	<!-- Disclaimer -->
	<p class="text-xs text-center text-foreground-subtle">
		{t.disclaimer}
	</p>

	<!-- CTA Block: Bridge to Trybotix -->
	<div class="card glass-accent border-2 border-[#22d3ee]/30">
		<div class="text-center py-6">
			<!-- Trybotix Logo -->
			<div class="flex justify-center mb-4">
				<img
					src="/trybotix-logo-white.png"
					alt="Trybotix Labs"
					class="h-14 sm:h-16"
				/>
			</div>

			<h3 class="text-lg font-semibold text-foreground mb-2">
				{cta.title}
			</h3>
			<p class="text-sm text-foreground-muted mb-4 max-w-md mx-auto">
				{cta.subtitle}
			</p>
			<p class="text-sm font-medium text-accent-400 mb-5">
				{cta.question}
			</p>

			<div class="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
				<Button
					variant="primary"
					onclick={() => window.open('https://www.trybotix.com', '_blank')}
				>
					{cta.visit_website}
					<ArrowRight class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					onclick={() => window.open('mailto:christian.ramirez@trybotix.com?subject=Consulta desde Cotizador AC', '_blank')}
				>
					<Mail class="h-4 w-4" />
					{cta.email}
				</Button>
			</div>

			<!-- Contact info -->
			<p class="text-xs text-foreground-subtle mt-4">
				{cta.contact_email}
			</p>
		</div>
	</div>
</div>
