<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowRight, Users, Clock, Cpu, Minus, Plus } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { HeatEquipment } from '$lib/types';

	const session = getSessionContext();
	const t = session.translations.wizard.questions;

	// Form state
	let occupants = $state(session.analysis?.estimatedOccupancy || 4);
	let operatingHours = $state<string>('full_day');
	let selectedEquipment = $state<string[]>([]);

	const hourOptions = [
		{ value: 'morning', label: t.hours.options.morning },
		{ value: 'afternoon', label: t.hours.options.afternoon },
		{ value: 'full_day', label: t.hours.options.full_day },
		{ value: 'evening', label: t.hours.options.evening },
		{ value: '24_7', label: t.hours.options['24_7'] }
	];

	const equipmentOptions = [
		{ value: 'computer', label: t.equipment.options.computer, icon: '💻' },
		{ value: 'server', label: t.equipment.options.server, icon: '🖥️' },
		{ value: 'printer', label: t.equipment.options.printer, icon: '🖨️' },
		{ value: 'kitchen', label: t.equipment.options.kitchen, icon: '🍳' },
		{ value: 'lighting', label: t.equipment.options.lighting, icon: '💡' }
	];

	onMount(() => {
		if (!session.analysis) {
			goto('/wizard/upload');
		}
	});

	function incrementOccupants() {
		if (occupants < 50) occupants++;
	}

	function decrementOccupants() {
		if (occupants > 1) occupants--;
	}

	function toggleEquipment(value: string) {
		if (selectedEquipment.includes(value)) {
			selectedEquipment = selectedEquipment.filter((e) => e !== value);
		} else {
			selectedEquipment = [...selectedEquipment, value];
		}
	}

	function proceed() {
		// Build heat equipment array
		const heatGeneratingEquipment: HeatEquipment[] = selectedEquipment.map((type) => ({
			type: type as HeatEquipment['type'],
			quantity: type === 'computer' ? Math.ceil(occupants * 0.8) : 1,
			btuPerUnit: 0 // Will be filled from constants
		}));

		session.setUserInputs({
			occupants,
			operatingHours: operatingHours as any,
			heatGeneratingEquipment,
			climateZone: 'tropical', // Default for Central America
			budgetPreference: 'balanced'
		});

		session.setStep('calculation');
		goto('/wizard/calculation');
	}
</script>

<div class="space-y-6 animate-fade-in">
	<!-- Title -->
	<div class="text-center">
		<h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-3">
			{t.title}
		</h1>
		<p class="text-foreground-muted">
			{t.subtitle}
		</p>
	</div>

	<!-- Occupants -->
	<div class="card">
		<label class="flex items-center gap-3 mb-5">
			<div class="h-10 w-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
				<Users class="h-5 w-5 text-accent-400" />
			</div>
			<span class="font-semibold text-foreground">{t.occupants.label}</span>
		</label>

		<div class="flex items-center justify-center gap-8">
			<button
				onclick={decrementOccupants}
				disabled={occupants <= 1}
				class={cn(
					'h-14 w-14 rounded-2xl flex items-center justify-center transition-all',
					'bg-surface border border-border',
					'hover:bg-surface-hover hover:border-border-subtle',
					'disabled:opacity-50 disabled:cursor-not-allowed'
				)}
			>
				<Minus class="h-5 w-5 text-foreground-muted" />
			</button>

			<div class="text-center min-w-20">
				<span class="text-5xl font-bold gradient-text">{occupants}</span>
				<p class="text-sm text-foreground-muted mt-1">
					{session.language === 'es' ? 'personas' : 'people'}
				</p>
			</div>

			<button
				onclick={incrementOccupants}
				disabled={occupants >= 50}
				class={cn(
					'h-14 w-14 rounded-2xl flex items-center justify-center transition-all',
					'bg-accent-500/15 border border-accent-500/30',
					'hover:bg-accent-500/25',
					'disabled:opacity-50 disabled:cursor-not-allowed'
				)}
			>
				<Plus class="h-5 w-5 text-accent-400" />
			</button>
		</div>
	</div>

	<!-- Operating Hours -->
	<div class="card">
		<label class="flex items-center gap-3 mb-5">
			<div class="h-10 w-10 rounded-xl bg-info/15 flex items-center justify-center">
				<Clock class="h-5 w-5 text-info" />
			</div>
			<span class="font-semibold text-foreground">{t.hours.label}</span>
		</label>

		<div class="grid grid-cols-2 gap-2">
			{#each hourOptions as option}
				<button
					onclick={() => (operatingHours = option.value)}
					class={cn(
						'px-4 py-3 rounded-xl text-sm font-medium transition-all',
						operatingHours === option.value
							? 'bg-gradient-to-r from-accent-500 to-orange-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
							: 'bg-surface border border-border text-foreground-muted hover:bg-surface-hover hover:border-border-subtle'
					)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Heat Generating Equipment -->
	<div class="card">
		<label class="flex items-center gap-3 mb-5">
			<div class="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center">
				<Cpu class="h-5 w-5 text-warning" />
			</div>
			<span class="font-semibold text-foreground">{t.equipment.label}</span>
		</label>

		<div class="flex flex-wrap gap-2">
			{#each equipmentOptions as option}
				<button
					onclick={() => toggleEquipment(option.value)}
					class={cn(
						'px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2',
						selectedEquipment.includes(option.value)
							? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
							: 'bg-surface border border-border text-foreground-muted hover:bg-surface-hover hover:border-border-subtle'
					)}
				>
					<span>{option.icon}</span>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Continue Button -->
	<Button variant="primary" size="lg" onclick={proceed} class="w-full">
		{session.translations.app.next}
		<ArrowRight class="h-5 w-5" />
	</Button>
</div>
