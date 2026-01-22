import type {
	RoomAnalysis,
	UserInputs,
	ThermalCalculation,
	CalculationBreakdown,
	QuoteOption,
	ACUnit,
	EnvelopeLoads,
	InternalLoads,
	VentilationLoads
} from '$lib/types';
import {
	BTU_PER_SQM,
	BTU_PER_OCCUPANT,
	BTU_PER_OCCUPANT_LATENT,
	EQUIPMENT_BTU,
	WINDOW_SHGC,
	SOLAR_RADIATION,
	WALL_TYPES,
	ROOF_TYPES,
	DESIGN_TEMP_DIFF,
	INFILTRATION_ACH,
	VENTILATION_CFM_PER_PERSON,
	BTU_PER_CFM_DEGREE_F,
	LATENT_HEAT_FACTOR,
	CEILING_FACTORS,
	SHAPE_FACTORS,
	SAFETY_MARGIN,
	BTU_PER_TON,
	AC_CATALOG,
	MONTHLY_OPERATING_HOURS,
	calculateMonthlyCost
} from '$lib/constants/thermal';

// Safety margin
const SAFETY_MARGIN_VALUE = 0.10; // 10%

export function calculateThermalLoad(
	analysis: RoomAnalysis,
	userInputs: UserInputs
): ThermalCalculation {
	const breakdown: CalculationBreakdown[] = [];
	const climateZone = userInputs.climateZone || 'tropical';
	const designDeltaT = DESIGN_TEMP_DIFF[climateZone];

	// Get room dimensions
	const area = analysis.dimensions.area; // m²
	const height = analysis.dimensions.height; // m
	const volume = analysis.dimensions.volume; // m³
	const perimeter = 2 * (analysis.dimensions.width + analysis.dimensions.length); // m
	const wallArea = perimeter * height; // m²

	// ============================================
	// 1. ENVELOPE LOADS (Cargas de Envolvente)
	// ============================================

	// 1a. Wall Transmission: Q = U × A × ΔT
	const wallType = WALL_TYPES['block_uninsulated']; // Default assumption
	const wallTransmission = Math.round(wallType.uValue * wallArea * designDeltaT);
	breakdown.push({
		category: 'Wall Transmission',
		categoryEs: 'Transmision Paredes',
		value: wallTransmission,
		percentage: 0,
		description: `${wallArea.toFixed(0)}m² × U=${wallType.uValue} × ΔT=${designDeltaT}°C`,
		descriptionEs: `${wallArea.toFixed(0)}m² × U=${wallType.uValue} × ΔT=${designDeltaT}°C`,
		group: 'envelope'
	});

	// 1b. Roof/Ceiling Transmission
	let roofTransmission = 0;
	if (analysis.ceilingType === 'exposed') {
		const roofType = ROOF_TYPES['concrete_uninsulated'];
		roofTransmission = Math.round(roofType.uValue * area * designDeltaT * 1.5); // 1.5x for roof exposure
		breakdown.push({
			category: 'Roof Transmission',
			categoryEs: 'Transmision Techo',
			value: roofTransmission,
			percentage: 0,
			description: `Exposed roof, ${area.toFixed(0)}m²`,
			descriptionEs: `Techo expuesto, ${area.toFixed(0)}m²`,
			group: 'envelope'
		});
	} else if (analysis.ceilingType === 'high') {
		roofTransmission = Math.round(area * designDeltaT * 0.5); // Minimal for interior space with high ceiling
		breakdown.push({
			category: 'Ceiling Transmission',
			categoryEs: 'Transmision Cielo',
			value: roofTransmission,
			percentage: 0,
			description: `High ceiling (${height.toFixed(1)}m)`,
			descriptionEs: `Techo alto (${height.toFixed(1)}m)`,
			group: 'envelope'
		});
	}

	// 1c. Window Transmission
	const windowArea = analysis.windows.approximateArea || (analysis.windows.count * 2); // Default 2m² per window
	const windowUValue = 3.0; // Single pane glass U-value
	const windowTransmission = Math.round(windowUValue * windowArea * designDeltaT);
	if (windowArea > 0) {
		breakdown.push({
			category: 'Window Transmission',
			categoryEs: 'Transmision Ventanas',
			value: windowTransmission,
			percentage: 0,
			description: `${analysis.windows.count} windows, ${windowArea.toFixed(1)}m²`,
			descriptionEs: `${analysis.windows.count} ventanas, ${windowArea.toFixed(1)}m²`,
			group: 'envelope'
		});
	}

	// 1d. Solar Heat Gain through windows
	const glassType = analysis.windows.hasSolarFilm ? 'tinted' : 'clear_single';
	const shgc = WINDOW_SHGC[glassType].shgc;
	const solarRadiation = SOLAR_RADIATION[analysis.windows.orientation];
	const solarGain = Math.round(windowArea * shgc * solarRadiation);
	if (windowArea > 0) {
		breakdown.push({
			category: 'Solar Gain (Windows)',
			categoryEs: 'Ganancia Solar (Ventanas)',
			value: solarGain,
			percentage: 0,
			description: `SHGC=${shgc}, ${analysis.windows.orientation} facing${analysis.hasDirectSunlight ? ', direct sun' : ''}`,
			descriptionEs: `SHGC=${shgc}, orientacion ${analysis.windows.orientation}${analysis.hasDirectSunlight ? ', sol directo' : ''}`,
			group: 'envelope'
		});
	}

	const envelopeLoads: EnvelopeLoads = {
		wallTransmission,
		roofTransmission,
		windowTransmission,
		solarGain,
		total: wallTransmission + roofTransmission + windowTransmission + solarGain
	};

	// ============================================
	// 2. INTERNAL LOADS (Cargas Internas)
	// ============================================

	// 2a. Occupant sensible heat
	const occupants = userInputs.occupants || analysis.estimatedOccupancy;
	const occupantsSensible = occupants * BTU_PER_OCCUPANT;
	breakdown.push({
		category: 'Occupants (Sensible)',
		categoryEs: 'Ocupantes (Sensible)',
		value: occupantsSensible,
		percentage: 0,
		description: `${occupants} people × ${BTU_PER_OCCUPANT} BTU`,
		descriptionEs: `${occupants} personas × ${BTU_PER_OCCUPANT} BTU`,
		group: 'internal'
	});

	// 2b. Equipment load
	let equipmentBtu = 0;
	const equipmentDetails: string[] = [];
	const equipmentDetailsEs: string[] = [];

	if (userInputs.heatGeneratingEquipment) {
		for (const equipment of userInputs.heatGeneratingEquipment) {
			const btuPerUnit = EQUIPMENT_BTU[equipment.type] || 300;
			const totalBtu = btuPerUnit * equipment.quantity;
			equipmentBtu += totalBtu;
			equipmentDetails.push(`${equipment.quantity}× ${equipment.type}`);
			equipmentDetailsEs.push(`${equipment.quantity}× ${equipment.type}`);
		}
	}

	// Add detected equipment from analysis
	if (analysis.detectedEquipment.length > 0) {
		for (const equipment of analysis.detectedEquipment) {
			if (EQUIPMENT_BTU[equipment]) {
				equipmentBtu += EQUIPMENT_BTU[equipment];
				equipmentDetails.push(`1× ${equipment} (detected)`);
				equipmentDetailsEs.push(`1× ${equipment} (detectado)`);
			}
		}
	}

	if (equipmentBtu > 0) {
		breakdown.push({
			category: 'Equipment',
			categoryEs: 'Equipos',
			value: equipmentBtu,
			percentage: 0,
			description: equipmentDetails.length > 0 ? equipmentDetails.join(', ') : 'No significant equipment',
			descriptionEs: equipmentDetailsEs.length > 0 ? equipmentDetailsEs.join(', ') : 'Sin equipos significativos',
			group: 'internal'
		});
	}

	// 2c. Lighting (estimated based on room type)
	const lightingWattsPerSqm = BTU_PER_SQM[analysis.roomType] > 600 ? 15 : 10; // W/m²
	const lightingBtu = Math.round(area * lightingWattsPerSqm * 3.412); // W to BTU/h
	breakdown.push({
		category: 'Lighting',
		categoryEs: 'Iluminacion',
		value: lightingBtu,
		percentage: 0,
		description: `${lightingWattsPerSqm} W/m² estimated`,
		descriptionEs: `${lightingWattsPerSqm} W/m² estimado`,
		group: 'internal'
	});

	const internalLoads: InternalLoads = {
		occupantsSensible,
		occupantsLatent: occupants * BTU_PER_OCCUPANT_LATENT,
		equipment: equipmentBtu,
		lighting: lightingBtu,
		total: occupantsSensible + equipmentBtu + lightingBtu
	};

	// ============================================
	// 3. VENTILATION & INFILTRATION
	// ============================================

	// 3a. Infiltration
	const infiltrationLevel = INFILTRATION_ACH['average'];
	const infiltrationCfm = (volume * infiltrationLevel.ach * 35.31) / 60; // m³/h to CFM
	const infiltrationBtu = Math.round(infiltrationCfm * BTU_PER_CFM_DEGREE_F * (designDeltaT * 1.8)); // °C to °F
	breakdown.push({
		category: 'Infiltration',
		categoryEs: 'Infiltracion',
		value: infiltrationBtu,
		percentage: 0,
		description: `${infiltrationLevel.ach} ACH, typical construction`,
		descriptionEs: `${infiltrationLevel.ach} ACH, construccion tipica`,
		group: 'ventilation'
	});

	// 3b. Fresh air ventilation
	const cfmPerPerson = VENTILATION_CFM_PER_PERSON[analysis.roomType];
	const ventilationCfm = occupants * cfmPerPerson;
	const ventilationBtu = Math.round(ventilationCfm * BTU_PER_CFM_DEGREE_F * (designDeltaT * 1.8));
	breakdown.push({
		category: 'Fresh Air (Ventilation)',
		categoryEs: 'Aire Fresco (Ventilacion)',
		value: ventilationBtu,
		percentage: 0,
		description: `${cfmPerPerson} CFM/person × ${occupants} people`,
		descriptionEs: `${cfmPerPerson} CFM/persona × ${occupants} personas`,
		group: 'ventilation'
	});

	const ventilationLoads: VentilationLoads = {
		infiltration: infiltrationBtu,
		freshAir: ventilationBtu,
		total: infiltrationBtu + ventilationBtu
	};

	// ============================================
	// 4. LATENT LOAD (Humidity)
	// ============================================

	const sensibleSubtotal = envelopeLoads.total + internalLoads.total + ventilationLoads.total;
	const latentFactor = LATENT_HEAT_FACTOR[climateZone].factor;
	const latentLoad = Math.round(sensibleSubtotal * latentFactor);
	breakdown.push({
		category: 'Latent Load (Humidity)',
		categoryEs: 'Carga Latente (Humedad)',
		value: latentLoad,
		percentage: 0,
		description: `${(latentFactor * 100).toFixed(0)}% of sensible (${climateZone} climate)`,
		descriptionEs: `${(latentFactor * 100).toFixed(0)}% del sensible (clima ${climateZone})`,
		group: 'other'
	});

	// ============================================
	// 5. SHAPE & CEILING ADJUSTMENTS
	// ============================================

	// Shape factor
	const shapeMultiplier = SHAPE_FACTORS[analysis.roomShape];
	let shapeAdjustment = 0;
	if (shapeMultiplier > 1.0) {
		shapeAdjustment = Math.round(sensibleSubtotal * (shapeMultiplier - 1));
		breakdown.push({
			category: 'Shape Adjustment',
			categoryEs: 'Ajuste por Forma',
			value: shapeAdjustment,
			percentage: 0,
			description: `${analysis.roomShape} room (+${((shapeMultiplier - 1) * 100).toFixed(0)}%)`,
			descriptionEs: `Espacio ${analysis.roomShape} (+${((shapeMultiplier - 1) * 100).toFixed(0)}%)`,
			group: 'other'
		});
	}

	// High ceiling factor (if not already in roof transmission)
	let ceilingAdjustment = 0;
	if (analysis.ceilingType === 'high' && height > 3.0) {
		const ceilingMultiplier = CEILING_FACTORS['high'];
		ceilingAdjustment = Math.round(sensibleSubtotal * (ceilingMultiplier - 1) * 0.5); // Reduced since we account elsewhere
		breakdown.push({
			category: 'High Ceiling Adjustment',
			categoryEs: 'Ajuste Techo Alto',
			value: ceilingAdjustment,
			percentage: 0,
			description: `Height ${height.toFixed(1)}m > 3m`,
			descriptionEs: `Altura ${height.toFixed(1)}m > 3m`,
			group: 'other'
		});
	}

	// ============================================
	// 6. SAFETY MARGIN
	// ============================================

	const preSafetyTotal = sensibleSubtotal + latentLoad + shapeAdjustment + ceilingAdjustment;
	const safetyMargin = Math.round(preSafetyTotal * SAFETY_MARGIN_VALUE);
	breakdown.push({
		category: 'Safety Margin',
		categoryEs: 'Margen de Seguridad',
		value: safetyMargin,
		percentage: 10,
		description: '10% safety factor',
		descriptionEs: '10% factor de seguridad',
		group: 'other'
	});

	// ============================================
	// FINAL TOTALS
	// ============================================

	const totalBtu = Math.round(preSafetyTotal + safetyMargin);
	const tonnage = totalBtu / BTU_PER_TON;

	// Calculate percentages
	for (const item of breakdown) {
		item.percentage = Math.round((item.value / totalBtu) * 100);
	}

	// Legacy compatibility fields
	const windowBtu = windowTransmission + solarGain;
	const sunlightBtu = analysis.hasDirectSunlight ? Math.round(solarGain * 0.3) : 0;
	const ceilingBtu = roofTransmission + ceilingAdjustment;

	return {
		baseBtu: Math.round(area * BTU_PER_SQM[analysis.roomType]),
		occupantBtu: occupantsSensible,
		equipmentBtu,
		windowBtu,
		sunlightBtu,
		ceilingBtu,
		safetyMargin,
		totalBtu,
		tonnage: Math.round(tonnage * 10) / 10,
		breakdown,
		envelopeLoads,
		internalLoads,
		ventilationLoads,
		latentLoad
	};
}

export function generateQuoteOptions(
	calculation: ThermalCalculation,
	userInputs: UserInputs
): QuoteOption[] {
	const { totalBtu, tonnage } = calculation;
	const hoursPerMonth = MONTHLY_OPERATING_HOURS[userInputs.operatingHours || 'full_day'];

	// First, group ALL catalog units by tier based on SEER rating
	const allEconomicUnits = AC_CATALOG.filter((u) => u.seer < 17);
	const allRecommendedUnits = AC_CATALOG.filter((u) => u.seer >= 17 && u.seer < 21);
	const allPremiumUnits = AC_CATALOG.filter((u) => u.seer >= 21);

	// Helper function to find the best unit(s) for a given BTU requirement within a tier
	function findBestUnitsForTier(units: ACUnit[], targetBtu: number): ACUnit[] {
		// Sort by capacity
		const sorted = [...units].sort((a, b) => a.btuCapacity - b.btuCapacity);

		// Find units that can cover the requirement (>= 80% of target)
		const suitable = sorted.filter((u) => u.btuCapacity >= targetBtu * 0.8);

		if (suitable.length > 0) {
			// Return the smallest unit that covers the requirement
			return [suitable[0]];
		}

		// If no single unit covers, find the closest (smallest that's bigger or largest available)
		const closestLarger = sorted.find((u) => u.btuCapacity >= targetBtu);
		if (closestLarger) {
			return [closestLarger];
		}

		// Return the largest available unit in this tier
		return sorted.length > 0 ? [sorted[sorted.length - 1]] : [];
	}

	// Find best units for each tier
	const economicUnits = findBestUnitsForTier(allEconomicUnits, totalBtu * 0.9);
	const recommendedUnits = findBestUnitsForTier(allRecommendedUnits, totalBtu);
	const premiumUnits = findBestUnitsForTier(allPremiumUnits, totalBtu * 1.1);

	// Helper to create option
	function createOption(
		tier: 'economic' | 'recommended' | 'premium',
		units: ACUnit[],
		targetBtu: number
	): QuoteOption | null {
		if (units.length === 0) return null;

		// Find the best unit(s) to meet the requirement
		const selectedUnits: ACUnit[] = [];
		let currentBtu = 0;

		// Sort by capacity to price ratio
		const sortedUnits = [...units].sort(
			(a, b) => a.btuCapacity / a.priceRange.min - b.btuCapacity / b.priceRange.min
		);

		for (const unit of sortedUnits) {
			if (currentBtu >= targetBtu) break;
			selectedUnits.push(unit);
			currentBtu += unit.btuCapacity;
		}

		if (selectedUnits.length === 0) {
			selectedUnits.push(sortedUnits[0]);
			currentBtu = sortedUnits[0].btuCapacity;
		}

		const totalPrice = {
			min: selectedUnits.reduce((sum, u) => sum + u.priceRange.min, 0),
			max: selectedUnits.reduce((sum, u) => sum + u.priceRange.max, 0),
			currency: 'USD' as const,
			installationIncluded: selectedUnits.every((u) => u.priceRange.installationIncluded)
		};

		const avgSeer =
			selectedUnits.reduce((sum, u) => sum + u.seer, 0) / selectedUnits.length;
		const monthlyCost = calculateMonthlyCost(currentBtu, avgSeer, hoursPerMonth);

		const coveragePercentage = Math.min(100, Math.round((currentBtu / targetBtu) * 100));

		const tierProsCons = getTierProsCons(tier, avgSeer, coveragePercentage);

		return {
			id: `${tier}-${Date.now()}`,
			tier,
			units: selectedUnits,
			totalBtu: currentBtu,
			coveragePercentage,
			estimatedPrice: totalPrice,
			estimatedMonthlyCost: monthlyCost,
			pros: tierProsCons.pros,
			prosEs: tierProsCons.prosEs,
			cons: tierProsCons.cons,
			consEs: tierProsCons.consEs,
			isRecommended: tier === 'recommended'
		};
	}

	const options: QuoteOption[] = [];

	// Create economic option
	const economicOption = createOption('economic', economicUnits, totalBtu * 0.9);
	if (economicOption) options.push(economicOption);

	// Create recommended option
	const recommendedOption = createOption('recommended', recommendedUnits, totalBtu);
	if (recommendedOption) options.push(recommendedOption);

	// Create premium option
	const premiumOption = createOption('premium', premiumUnits, totalBtu * 1.1);
	if (premiumOption) options.push(premiumOption);

	return options;
}

function getTierProsCons(tier: 'economic' | 'recommended' | 'premium', seer: number, coverage: number) {
	const tiers = {
		economic: {
			pros: [
				'Lowest upfront cost',
				'Quick availability',
				'Simple installation'
			],
			prosEs: [
				'Menor costo inicial',
				'Disponibilidad rapida',
				'Instalacion simple'
			],
			cons: [
				'Higher energy consumption',
				'Shorter warranty',
				'Basic features only'
			],
			consEs: [
				'Mayor consumo energetico',
				'Garantia mas corta',
				'Solo funciones basicas'
			]
		},
		recommended: {
			pros: [
				'Best value for money',
				'Energy efficient (Inverter)',
				'Extended warranty',
				'WiFi control included'
			],
			prosEs: [
				'Mejor relacion costo-beneficio',
				'Eficiencia energetica (Inverter)',
				'Garantia extendida',
				'Control WiFi incluido'
			],
			cons: [
				'Moderate upfront investment'
			],
			consEs: [
				'Inversion inicial moderada'
			]
		},
		premium: {
			pros: [
				'Maximum energy efficiency',
				'Longest warranty (12 years)',
				'Premium features & quiet operation',
				'Award-winning design',
				'Advanced air purification'
			],
			prosEs: [
				'Maxima eficiencia energetica',
				'Garantia mas larga (12 anos)',
				'Funciones premium y operacion silenciosa',
				'Diseno premiado',
				'Purificacion de aire avanzada'
			],
			cons: [
				'Higher upfront cost',
				'May have longer delivery times'
			],
			consEs: [
				'Mayor costo inicial',
				'Puede tener tiempos de entrega mas largos'
			]
		}
	};

	return tiers[tier];
}

export function formatBtu(btu: number): string {
	if (btu >= 1000) {
		return `${(btu / 1000).toFixed(1)}K BTU`;
	}
	return `${btu} BTU`;
}

export function formatTonnage(tonnage: number): string {
	return `${tonnage.toFixed(1)} TR`;
}

export function formatPrice(price: { min: number; max: number; currency: string }): string {
	return `$${price.min.toLocaleString()} - $${price.max.toLocaleString()} ${price.currency}`;
}

// Helper function to group breakdown items by category
export function groupBreakdownItems(breakdown: CalculationBreakdown[]): {
	envelope: CalculationBreakdown[];
	internal: CalculationBreakdown[];
	ventilation: CalculationBreakdown[];
	other: CalculationBreakdown[];
} {
	return {
		envelope: breakdown.filter(item => item.group === 'envelope'),
		internal: breakdown.filter(item => item.group === 'internal'),
		ventilation: breakdown.filter(item => item.group === 'ventilation'),
		other: breakdown.filter(item => item.group === 'other')
	};
}
