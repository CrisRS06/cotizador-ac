<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import LanguageSwitcher from '$lib/components/common/LanguageSwitcher.svelte';
	import { ArrowLeft, Check } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { WizardStep } from '$lib/types';

	let { children } = $props();

	const session = getSessionContext();

	const steps: { key: WizardStep; label: string }[] = [
		{ key: 'upload', label: session.translations.wizard.progress.step1 },
		{ key: 'analysis', label: session.translations.wizard.progress.step2 },
		{ key: 'questions', label: session.translations.wizard.progress.step3 },
		{ key: 'calculation', label: session.translations.wizard.progress.step4 },
		{ key: 'quote', label: session.translations.wizard.progress.step5 }
	];

	const stepOrder: WizardStep[] = ['upload', 'analysis', 'questions', 'calculation', 'quote'];

	// Derive current step from URL
	const currentStepFromUrl = $derived(() => {
		const path = $page.url.pathname;
		if (path.includes('/upload')) return 'upload';
		if (path.includes('/analysis')) return 'analysis';
		if (path.includes('/questions')) return 'questions';
		if (path.includes('/calculation')) return 'calculation';
		if (path.includes('/quote')) return 'quote';
		return 'upload';
	});

	const currentIndex = $derived(stepOrder.indexOf(currentStepFromUrl()));

	function goBack() {
		if (currentIndex > 0) {
			const prevStep = stepOrder[currentIndex - 1];
			goto(`/wizard/${prevStep}`);
		} else {
			goto('/');
		}
	}

	function isStepCompleted(stepKey: WizardStep): boolean {
		const stepIdx = stepOrder.indexOf(stepKey);
		return stepIdx < currentIndex;
	}

	function isStepCurrent(stepKey: WizardStep): boolean {
		return stepKey === currentStepFromUrl();
	}
</script>

<div class="min-h-screen bg-background flex flex-col">
	<!-- Header -->
	<header class="glass border-b border-border px-4 py-3 sticky top-0 z-50">
		<div class="mx-auto max-w-2xl flex items-center justify-between">
			<button
				onclick={goBack}
				class="flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors rounded-lg px-2 py-1.5 hover:bg-surface"
				aria-label={session.translations.app.back}
			>
				<ArrowLeft class="h-5 w-5" />
				<span class="text-sm font-medium">{session.translations.app.back}</span>
			</button>

			<div class="flex items-center gap-2">
				<div
					class="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center"
				>
					<span class="text-white font-bold text-xs">AC</span>
				</div>
			</div>

			<LanguageSwitcher />
		</div>
	</header>

	<!-- Progress Indicator -->
	<div class="glass border-b border-border px-4 py-4">
		<div class="mx-auto max-w-2xl">
			<div class="flex items-center justify-between relative">
				<!-- Progress Line Background -->
				<div
					class="absolute top-4 left-0 right-0 h-0.5 bg-border"
					style="left: 10%; right: 10%;"
				></div>

				<!-- Progress Line Filled -->
				<div
					class="absolute top-4 h-0.5 bg-gradient-to-r from-accent-500 to-orange-500 transition-all duration-500"
					style="left: 10%; width: {(currentIndex / (steps.length - 1)) * 80}%;"
				></div>

				{#each steps as step, index}
					<div class="flex flex-col items-center relative z-10">
						<!-- Step Circle -->
						<div
							class={cn(
								'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
								isStepCompleted(step.key)
									? 'bg-gradient-to-br from-accent-500 to-orange-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
									: isStepCurrent(step.key)
										? 'bg-surface border-2 border-accent-500 text-accent-500 animate-ring-pulse'
										: 'bg-surface border border-border text-foreground-subtle'
							)}
						>
							{#if isStepCompleted(step.key)}
								<Check class="h-4 w-4" />
							{:else}
								{index + 1}
							{/if}
						</div>

						<!-- Step Label (hidden on mobile, visible on larger screens) -->
						<span
							class={cn(
								'text-xs mt-2 hidden sm:block transition-colors duration-300 text-center max-w-16',
								isStepCurrent(step.key)
									? 'text-accent-500 font-medium'
									: isStepCompleted(step.key)
										? 'text-foreground-muted'
										: 'text-foreground-subtle'
							)}
						>
							{step.label}
						</span>
					</div>
				{/each}
			</div>

			<!-- Mobile step label -->
			<div class="text-center mt-3 sm:hidden">
				<span class="text-sm text-accent-500 font-medium">
					{steps[currentIndex]?.label}
				</span>
				<span class="text-foreground-subtle text-sm ml-2">
					({currentIndex + 1}/{steps.length})
				</span>
			</div>
		</div>
	</div>

	<!-- Content -->
	<main class="flex-1 px-4 py-8">
		<div class="mx-auto max-w-2xl">
			{@render children()}
		</div>
	</main>
</div>
