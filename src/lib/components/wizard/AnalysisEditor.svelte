<script lang="ts">
	import { getSessionContext } from '$lib/stores/session.svelte';
	import { X, Check, Ruler, LayoutGrid, Home, Sun, Layers } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { RoomAnalysis, RoomType } from '$lib/types';

	interface Props {
		analysis: RoomAnalysis;
		onSave: (updated: RoomAnalysis) => void;
		onCancel: () => void;
	}

	let { analysis, onSave, onCancel }: Props = $props();

	const session = getSessionContext();
	const roomTypes = session.translations.room_types;

	// Extract initial values from analysis prop (intentionally capturing initial snapshot for editing)
	const initialValues = {
		width: analysis.dimensions.width,
		length: analysis.dimensions.length,
		height: analysis.dimensions.height,
		windowCount: analysis.windows.count,
		windowOrientation: analysis.windows.orientation,
		hasSolarFilm: analysis.windows.hasSolarFilm,
		roomType: analysis.roomType,
		ceilingType: analysis.ceilingType,
		hasDirectSunlight: analysis.hasDirectSunlight,
		roomShape: analysis.roomShape
	};

	// Editable state
	let width = $state(initialValues.width);
	let length = $state(initialValues.length);
	let height = $state(initialValues.height);
	let windowCount = $state(initialValues.windowCount);
	let windowOrientation = $state(initialValues.windowOrientation);
	let hasSolarFilm = $state(initialValues.hasSolarFilm);
	let roomType: RoomType = $state(initialValues.roomType);
	let ceilingType = $state(initialValues.ceilingType);
	let hasDirectSunlight = $state(initialValues.hasDirectSunlight);
	let roomShape = $state(initialValues.roomShape);

	// Computed values
	const area = $derived(width * length);
	const volume = $derived(width * length * height);

	const orientationOptions = [
		{ value: 'north', label: session.language === 'es' ? 'Norte' : 'North' },
		{ value: 'south', label: session.language === 'es' ? 'Sur' : 'South' },
		{ value: 'east', label: session.language === 'es' ? 'Este' : 'East' },
		{ value: 'west', label: session.language === 'es' ? 'Oeste' : 'West' },
		{ value: 'unknown', label: session.language === 'es' ? 'Desconocido' : 'Unknown' }
	];

	const ceilingOptions = [
		{ value: 'standard', label: session.language === 'es' ? 'Estandar (<3m)' : 'Standard (<3m)' },
		{ value: 'high', label: session.language === 'es' ? 'Alto (>3m)' : 'High (>3m)' },
		{ value: 'exposed', label: session.language === 'es' ? 'Expuesto' : 'Exposed' },
		{ value: 'drop', label: session.language === 'es' ? 'Cielo falso' : 'Drop ceiling' }
	];

	const shapeOptions = [
		{ value: 'rectangular', label: session.language === 'es' ? 'Rectangular' : 'Rectangular' },
		{ value: 'L-shaped', label: session.language === 'es' ? 'Forma L' : 'L-shaped' },
		{ value: 'irregular', label: session.language === 'es' ? 'Irregular' : 'Irregular' }
	];

	const roomTypeOptions: { value: RoomType; label: string }[] = [
		{ value: 'office', label: roomTypes.office },
		{ value: 'conference', label: roomTypes.conference },
		{ value: 'server_room', label: roomTypes.server_room },
		{ value: 'residential_bedroom', label: roomTypes.residential_bedroom },
		{ value: 'residential_living', label: roomTypes.residential_living },
		{ value: 'restaurant', label: roomTypes.restaurant },
		{ value: 'retail', label: roomTypes.retail },
		{ value: 'warehouse', label: roomTypes.warehouse },
		{ value: 'gym', label: roomTypes.gym },
		{ value: 'classroom', label: roomTypes.classroom },
		{ value: 'other', label: roomTypes.other }
	];

	function handleSave() {
		const updated: RoomAnalysis = {
			...analysis,
			dimensions: {
				width,
				length,
				height,
				area,
				volume
			},
			windows: {
				...analysis.windows,
				count: windowCount,
				orientation: windowOrientation as typeof analysis.windows.orientation,
				hasSolarFilm
			},
			roomType,
			ceilingType: ceilingType as typeof analysis.ceilingType,
			hasDirectSunlight,
			roomShape: roomShape as typeof analysis.roomShape
		};
		onSave(updated);
	}

	const inputClass = cn(
		'w-full rounded-xl border border-border bg-surface px-3 py-2.5',
		'text-sm text-foreground',
		'focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30',
		'transition-all duration-200'
	);

	const selectClass = cn(
		'w-full rounded-xl border border-border bg-surface px-3 py-2.5',
		'text-sm text-foreground appearance-none cursor-pointer',
		'focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30',
		'transition-all duration-200'
	);
</script>

<div class="card border-accent-500/30 animate-scale-in">
	<div class="flex items-center justify-between mb-5">
		<h3 class="font-semibold text-foreground">
			{session.language === 'es' ? 'Editar valores detectados' : 'Edit detected values'}
		</h3>
		<button
			onclick={onCancel}
			class="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
			aria-label="Cancelar"
		>
			<X class="h-5 w-5 text-foreground-muted" />
		</button>
	</div>

	<div class="space-y-6">
		<!-- Dimensions Section -->
		<div>
			<div class="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
				<div class="h-7 w-7 rounded-lg bg-accent-500/15 flex items-center justify-center">
					<Ruler class="h-4 w-4 text-accent-400" />
				</div>
				{session.language === 'es' ? 'Dimensiones' : 'Dimensions'}
			</div>
			<div class="grid grid-cols-3 gap-3">
				<label class="block">
					<span class="text-xs text-foreground-muted mb-1.5 block">
						{session.language === 'es' ? 'Ancho (m)' : 'Width (m)'}
					</span>
					<input
						type="number"
						bind:value={width}
						min="1"
						max="100"
						step="0.1"
						class={inputClass}
					/>
				</label>
				<label class="block">
					<span class="text-xs text-foreground-muted mb-1.5 block">
						{session.language === 'es' ? 'Largo (m)' : 'Length (m)'}
					</span>
					<input
						type="number"
						bind:value={length}
						min="1"
						max="100"
						step="0.1"
						class={inputClass}
					/>
				</label>
				<label class="block">
					<span class="text-xs text-foreground-muted mb-1.5 block">
						{session.language === 'es' ? 'Alto (m)' : 'Height (m)'}
					</span>
					<input
						type="number"
						bind:value={height}
						min="2"
						max="20"
						step="0.1"
						class={inputClass}
					/>
				</label>
			</div>
			<p class="text-xs text-foreground-muted mt-3">
				{session.language === 'es' ? 'Area calculada' : 'Calculated area'}: <span
					class="font-semibold gradient-text">{area.toFixed(1)} m²</span
				>
			</p>
		</div>

		<!-- Windows Section -->
		<div>
			<div class="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
				<div class="h-7 w-7 rounded-lg bg-info/15 flex items-center justify-center">
					<LayoutGrid class="h-4 w-4 text-info" />
				</div>
				{session.language === 'es' ? 'Ventanas' : 'Windows'}
			</div>
			<div class="grid grid-cols-2 gap-3">
				<label class="block">
					<span class="text-xs text-foreground-muted mb-1.5 block">
						{session.language === 'es' ? 'Cantidad' : 'Count'}
					</span>
					<input
						type="number"
						bind:value={windowCount}
						min="0"
						max="20"
						class={inputClass}
					/>
				</label>
				<label class="block">
					<span class="text-xs text-foreground-muted mb-1.5 block">
						{session.language === 'es' ? 'Orientacion' : 'Orientation'}
					</span>
					<select bind:value={windowOrientation} class={selectClass}>
						{#each orientationOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</label>
			</div>
			<label class="flex items-center gap-3 mt-4 cursor-pointer group">
				<div class="relative">
					<input
						type="checkbox"
						bind:checked={hasSolarFilm}
						class="sr-only peer"
					/>
					<div
						class="w-10 h-6 rounded-full bg-surface-hover border border-border peer-checked:bg-accent-500 peer-checked:border-accent-500 transition-all"
					></div>
					<div
						class="absolute top-1 left-1 w-4 h-4 rounded-full bg-foreground-muted peer-checked:bg-white peer-checked:translate-x-4 transition-all"
					></div>
				</div>
				<span class="text-sm text-foreground-muted group-hover:text-foreground transition-colors">
					{session.language === 'es'
						? 'Tiene pelicula solar / vidrio polarizado'
						: 'Has solar film / tinted glass'}
				</span>
			</label>
		</div>

		<!-- Room Type Section -->
		<label class="block">
			<span class="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
				<div class="h-7 w-7 rounded-lg bg-success/15 flex items-center justify-center">
					<Home class="h-4 w-4 text-success" />
				</div>
				{session.language === 'es' ? 'Tipo de espacio' : 'Space type'}
			</span>
			<select bind:value={roomType} class={selectClass}>
				{#each roomTypeOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>

		<!-- Ceiling & Shape Section -->
		<div class="grid grid-cols-2 gap-3">
			<label class="block">
				<span class="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
					<div class="h-7 w-7 rounded-lg bg-warning/15 flex items-center justify-center">
						<Layers class="h-4 w-4 text-warning" />
					</div>
					{session.language === 'es' ? 'Techo' : 'Ceiling'}
				</span>
				<select bind:value={ceilingType} class={selectClass}>
					{#each ceilingOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-foreground mb-3 block pt-9">
					{session.language === 'es' ? 'Forma' : 'Shape'}
				</span>
				<select bind:value={roomShape} class={selectClass}>
					{#each shapeOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
		</div>

		<!-- Sunlight Toggle -->
		<label class="flex items-center gap-3 cursor-pointer group">
			<div class="relative">
				<input type="checkbox" bind:checked={hasDirectSunlight} class="sr-only peer" />
				<div
					class="w-10 h-6 rounded-full bg-surface-hover border border-border peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all"
				></div>
				<div
					class="absolute top-1 left-1 w-4 h-4 rounded-full bg-foreground-muted peer-checked:bg-white peer-checked:translate-x-4 transition-all"
				></div>
			</div>
			<Sun class="h-4 w-4 text-orange-400" />
			<span class="text-sm text-foreground-muted group-hover:text-foreground transition-colors">
				{session.language === 'es' ? 'Recibe sol directo' : 'Receives direct sunlight'}
			</span>
		</label>
	</div>

	<!-- Action Buttons -->
	<div class="flex gap-3 mt-6 pt-5 border-t border-border">
		<button onclick={onCancel} class="flex-1 btn btn-secondary text-sm py-3 rounded-xl">
			{session.language === 'es' ? 'Cancelar' : 'Cancel'}
		</button>
		<button
			onclick={handleSave}
			class={cn(
				'flex-1 flex items-center justify-center gap-2 text-sm py-3 rounded-xl font-medium',
				'bg-gradient-to-r from-accent-500 to-orange-600 text-white',
				'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
				'hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all'
			)}
		>
			<Check class="h-4 w-4" />
			{session.language === 'es' ? 'Guardar cambios' : 'Save changes'}
		</button>
	</div>
</div>
