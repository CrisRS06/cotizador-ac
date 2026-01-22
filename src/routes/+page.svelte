<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LanguageSwitcher from '$lib/components/common/LanguageSwitcher.svelte';
	import { Camera, MessageCircle, Sparkles, FileText, Clock, ArrowRight, Zap, Mail } from 'lucide-svelte';

	const session = getSessionContext();

	function startWizard() {
		session.setMode('wizard');
		goto('/wizard/upload');
	}

	function startChat() {
		session.setMode('chat');
		goto('/chat');
	}
</script>

<div class="min-h-screen bg-background relative overflow-hidden">
	<!-- Floating Orbs Background -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div
			class="floating-orb floating-orb-amber w-96 h-96 -top-48 -right-48 animate-float"
		></div>
		<div
			class="floating-orb floating-orb-orange w-64 h-64 bottom-1/4 -left-32 animate-float"
			style="animation-delay: 1s;"
		></div>
		<div
			class="floating-orb floating-orb-amber w-48 h-48 top-1/3 right-1/4 animate-float opacity-20"
			style="animation-delay: 2s;"
		></div>
	</div>

	<!-- Header -->
	<header class="fixed top-0 left-0 right-0 z-50 px-4 py-4">
		<div class="mx-auto max-w-5xl flex items-center justify-between">
			<a
				href="https://www.trybotix.com"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:opacity-80 transition-opacity"
			>
				<img
					src="/trybotix-logo-white.png"
					alt="Trybotix Labs"
					class="h-12 sm:h-14"
				/>
			</a>
			<LanguageSwitcher />
		</div>
	</header>

	<!-- Main Content -->
	<main class="pt-24 pb-24 px-4">
		<div class="mx-auto max-w-5xl">
			<!-- Hero Section -->
			<section class="text-center py-12 md:py-20 animate-fade-in">
				<!-- Badge -->
				<div
					class="inline-flex items-center gap-2 rounded-full glass-accent px-4 py-2 text-sm mb-8"
				>
					<Sparkles class="h-4 w-4 text-accent-400" />
					<span class="text-accent-400 font-medium">
						{session.language === 'es' ? '60 segundos' : '60 seconds'}
					</span>
				</div>

				<!-- Headline -->
				<h1
					class="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6 text-balance"
				>
					{session.translations.landing.headline}
				</h1>

				<!-- Subheadline -->
				<p class="text-lg md:text-xl text-foreground-muted mb-10 max-w-2xl mx-auto text-pretty">
					{session.translations.landing.subheadline}
				</p>

				<!-- Primary CTA -->
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<Button variant="primary" size="lg" onclick={startWizard} class="w-full sm:w-auto">
						<Camera class="h-5 w-5" />
						{session.translations.landing.cta_wizard}
						<ArrowRight class="h-5 w-5" />
					</Button>
					<Button variant="secondary" size="lg" onclick={startChat} class="w-full sm:w-auto">
						<MessageCircle class="h-5 w-5" />
						{session.translations.landing.cta_chat}
					</Button>
				</div>
			</section>

			<!-- Bento Grid: How It Works -->
			<section class="py-12 animate-fade-in-up" style="animation-delay: 200ms;">
				<h2 class="text-lg font-semibold text-foreground-muted mb-8 text-center uppercase tracking-wider">
					{session.translations.landing.features.title}
				</h2>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<!-- Step 1: Upload -->
					<div
						class="card hover-lift group cursor-default"
					>
						<div
							class="h-14 w-14 rounded-2xl bg-accent-500/15 flex items-center justify-center mb-4 group-hover:bg-accent-500/25 transition-colors"
						>
							<Camera class="h-7 w-7 text-accent-400" />
						</div>
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs font-medium text-accent-500 uppercase tracking-wider">
								{session.language === 'es' ? 'Paso 1' : 'Step 1'}
							</span>
						</div>
						<h3 class="font-semibold text-foreground text-lg mb-2">
							{session.translations.landing.features.step1.title}
						</h3>
						<p class="text-sm text-foreground-muted">
							{session.translations.landing.features.step1.description}
						</p>
					</div>

					<!-- Step 2: AI Analysis -->
					<div
						class="card hover-lift group cursor-default gradient-border"
					>
						<div
							class="h-14 w-14 rounded-2xl bg-accent-500/15 flex items-center justify-center mb-4 group-hover:bg-accent-500/25 transition-colors"
						>
							<Sparkles class="h-7 w-7 text-accent-400" />
						</div>
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs font-medium text-accent-500 uppercase tracking-wider">
								{session.language === 'es' ? 'Paso 2' : 'Step 2'}
							</span>
							<span class="badge badge-accent text-xs">AI</span>
						</div>
						<h3 class="font-semibold text-foreground text-lg mb-2">
							{session.translations.landing.features.step2.title}
						</h3>
						<p class="text-sm text-foreground-muted">
							{session.translations.landing.features.step2.description}
						</p>
					</div>

					<!-- Step 3: Quote -->
					<div
						class="card hover-lift group cursor-default"
					>
						<div
							class="h-14 w-14 rounded-2xl bg-success/15 flex items-center justify-center mb-4 group-hover:bg-success/25 transition-colors"
						>
							<FileText class="h-7 w-7 text-success" />
						</div>
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs font-medium text-accent-500 uppercase tracking-wider">
								{session.language === 'es' ? 'Paso 3' : 'Step 3'}
							</span>
						</div>
						<h3 class="font-semibold text-foreground text-lg mb-2">
							{session.translations.landing.features.step3.title}
						</h3>
						<p class="text-sm text-foreground-muted">
							{session.translations.landing.features.step3.description}
						</p>
					</div>
				</div>
			</section>

			<!-- Time Badge -->
			<div
				class="text-center py-8 animate-fade-in"
				style="animation-delay: 400ms;"
			>
				<div
					class="inline-flex items-center gap-2 text-sm text-foreground-muted glass rounded-full px-4 py-2"
				>
					<Clock class="h-4 w-4 text-accent-500" />
					<span>
						{session.language === 'es' ? 'Tiempo promedio: 2 minutos' : 'Average time: 2 minutes'}
					</span>
				</div>
			</div>

			<!-- CTA Block: Bridge to Trybotix -->
			<section
				class="py-8 animate-fade-in-up"
				style="animation-delay: 500ms;"
			>
				<div class="card glass-accent border-2 border-[#22d3ee]/30 text-center py-8">
					<!-- Trybotix Logo -->
					<div class="flex justify-center mb-6">
						<img
							src="/trybotix-logo-white.png"
							alt="Trybotix Labs"
							class="h-16 sm:h-20"
						/>
					</div>

					<h3 class="text-xl font-semibold text-foreground mb-3">
						{session.translations.cta.title}
					</h3>
					<p class="text-foreground-muted mb-4 max-w-lg mx-auto text-sm">
						{session.translations.cta.subtitle}
					</p>
					<p class="text-accent-400 font-medium mb-6">
						{session.translations.cta.question}
					</p>

					<div class="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
						<Button
							variant="primary"
							onclick={() => window.open('https://www.trybotix.com', '_blank')}
						>
							{session.translations.cta.visit_website}
							<ArrowRight class="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							onclick={() => window.open('mailto:christian.ramirez@trybotix.com?subject=Consulta desde Cotizador AC', '_blank')}
						>
							<Mail class="h-4 w-4" />
							{session.translations.cta.email}
						</Button>
					</div>

					<!-- Contact info -->
					<p class="text-xs text-foreground-subtle mt-4">
						{session.translations.cta.contact_email}
					</p>
				</div>
			</section>
		</div>
	</main>

	<!-- Footer -->
	<footer
		class="fixed bottom-0 left-0 right-0 glass border-t border-border py-3 px-4"
	>
		<div class="mx-auto max-w-5xl text-center">
			<a
				href="https://www.trybotix.com"
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-foreground-subtle hover:text-[#22d3ee] transition-colors"
			>
				{session.translations.app.powered_by} • www.trybotix.com
			</a>
		</div>
	</footer>
</div>
