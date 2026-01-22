import type { RoomType, ClimateZone, ACUnit } from '$lib/types';

// ============================================
// ASHRAE/ACCA-STYLE THERMAL CALCULATION CONSTANTS
// ============================================

// BTU per square meter based on room type (base sensible load)
export const BTU_PER_SQM: Record<RoomType, number> = {
	office: 600,
	conference: 650,
	server_room: 1000,
	residential_bedroom: 500,
	residential_living: 550,
	restaurant: 700,
	retail: 650,
	warehouse: 400,
	gym: 750,
	classroom: 600,
	other: 600
};

// BTU per occupant (sensible heat)
export const BTU_PER_OCCUPANT = 250; // Sensible only

// BTU per occupant (latent heat - metabolic moisture)
export const BTU_PER_OCCUPANT_LATENT = 200;

// BTU for heat-generating equipment
export const EQUIPMENT_BTU: Record<string, number> = {
	computer: 400,
	server: 2000,
	printer: 500,
	kitchen_small: 1500,
	kitchen_large: 5000,
	lighting_standard: 100,
	lighting_intense: 300
};

// ============================================
// ENVELOPE TRANSMISSION (U-values)
// ============================================

// U-values for wall types (BTU/hr-ft²-°F)
// Converted to metric: BTU/hr-m²-°C by multiplying by ~5.678
export interface WallType {
	uValue: number; // BTU/hr-m²-°C
	nameEs: string;
	nameEn: string;
}

export const WALL_TYPES: Record<string, WallType> = {
	block_uninsulated: { uValue: 2.5, nameEs: 'Bloque sin aislar', nameEn: 'Uninsulated block' },
	block_insulated: { uValue: 1.2, nameEs: 'Bloque con aislante', nameEn: 'Insulated block' },
	drywall_insulated: { uValue: 0.8, nameEs: 'Tablaroca con aislante', nameEn: 'Insulated drywall' },
	glass_curtain: { uValue: 4.0, nameEs: 'Muro cortina de vidrio', nameEn: 'Glass curtain wall' },
	concrete: { uValue: 2.0, nameEs: 'Concreto', nameEn: 'Concrete' }
};

// U-values for roof types (BTU/hr-m²-°C)
export const ROOF_TYPES: Record<string, WallType> = {
	concrete_uninsulated: { uValue: 3.0, nameEs: 'Losa sin aislar', nameEn: 'Uninsulated concrete slab' },
	concrete_insulated: { uValue: 1.0, nameEs: 'Losa con aislante', nameEn: 'Insulated concrete slab' },
	metal_uninsulated: { uValue: 5.0, nameEs: 'Lamina metalica', nameEn: 'Metal sheet' },
	metal_insulated: { uValue: 1.5, nameEs: 'Lamina con aislante', nameEn: 'Insulated metal' },
	tile: { uValue: 2.0, nameEs: 'Teja', nameEn: 'Tile roof' }
};

// Default design temperature difference (outdoor - indoor) in °C
export const DESIGN_TEMP_DIFF: Record<ClimateZone, number> = {
	tropical: 12, // 35°C outdoor, 23°C indoor
	subtropical: 10, // 33°C outdoor, 23°C indoor
	temperate: 8, // 30°C outdoor, 22°C indoor
	arid: 15 // 40°C outdoor, 25°C indoor
};

// ============================================
// SOLAR HEAT GAIN (SHGC)
// ============================================

// Solar Heat Gain Coefficient for window types
export interface WindowGlassType {
	shgc: number; // Solar Heat Gain Coefficient (0-1)
	nameEs: string;
	nameEn: string;
}

export const WINDOW_SHGC: Record<string, WindowGlassType> = {
	clear_single: { shgc: 0.86, nameEs: 'Vidrio simple sin pelicula', nameEn: 'Clear single pane' },
	clear_double: { shgc: 0.76, nameEs: 'Vidrio doble', nameEn: 'Clear double pane' },
	tinted: { shgc: 0.60, nameEs: 'Con pelicula solar', nameEn: 'Tinted/film' },
	low_e: { shgc: 0.40, nameEs: 'Low-E coating', nameEn: 'Low-E coating' },
	reflective: { shgc: 0.25, nameEs: 'Reflectivo', nameEn: 'Reflective' }
};

// Peak solar radiation by orientation (BTU/hr-m²)
export const SOLAR_RADIATION: Record<string, number> = {
	north: 80, // Minimal direct sun
	south: 200, // Moderate
	east: 280, // Morning sun
	west: 320, // Afternoon sun (hottest)
	unknown: 200
};

// Window orientation factors (legacy - for backwards compatibility)
export const WINDOW_FACTORS: Record<string, number> = {
	west: 1.20,
	east: 1.15,
	south: 1.10,
	north: 1.0,
	unknown: 1.10
};

// Solar film factor (if no film present) - legacy
export const NO_SOLAR_FILM_FACTOR = 1.20;

// ============================================
// INFILTRATION & VENTILATION
// ============================================

// Air Changes per Hour (ACH) based on construction quality
export interface InfiltrationLevel {
	ach: number;
	nameEs: string;
	nameEn: string;
}

export const INFILTRATION_ACH: Record<string, InfiltrationLevel> = {
	tight: { ach: 0.3, nameEs: 'Construccion nueva sellada', nameEn: 'New tight construction' },
	average: { ach: 0.5, nameEs: 'Construccion tipica', nameEn: 'Average construction' },
	leaky: { ach: 1.0, nameEs: 'Edificio antiguo', nameEn: 'Old/leaky building' }
};

// Ventilation requirements (CFM per person, converted to m³/h)
export const VENTILATION_CFM_PER_PERSON: Record<RoomType, number> = {
	office: 20, // 20 CFM/person = ~34 m³/h
	conference: 20,
	server_room: 0, // Usually sealed
	residential_bedroom: 15,
	residential_living: 15,
	restaurant: 20,
	retail: 20,
	warehouse: 10,
	gym: 25, // Higher due to activity
	classroom: 15,
	other: 20
};

// Air properties for load calculation
export const AIR_DENSITY = 1.2; // kg/m³
export const AIR_SPECIFIC_HEAT = 1.006; // kJ/kg-°C
export const BTU_PER_CFM_DEGREE_F = 1.08; // BTU/hr per CFM per °F

// ============================================
// LATENT HEAT (HUMIDITY)
// ============================================

// Latent heat factor by climate (ratio of latent to sensible load)
export interface LatentHeatClimate {
	factor: number;
	nameEs: string;
	nameEn: string;
}

export const LATENT_HEAT_FACTOR: Record<ClimateZone, LatentHeatClimate> = {
	tropical: { factor: 0.35, nameEs: 'Alta humedad (>70%)', nameEn: 'High humidity (>70%)' },
	subtropical: { factor: 0.30, nameEs: 'Humedad moderada-alta', nameEn: 'Moderate-high humidity' },
	temperate: { factor: 0.20, nameEs: 'Humedad moderada', nameEn: 'Moderate humidity' },
	arid: { factor: 0.10, nameEs: 'Baja humedad (<40%)', nameEn: 'Low humidity (<40%)' }
};

// ============================================
// CEILING & SHAPE FACTORS
// ============================================

// Ceiling factors
export const CEILING_FACTORS: Record<string, number> = {
	standard: 1.0,
	high: 1.25, // >3m = +25%
	exposed: 1.15, // +15%
	drop: 1.0
};

// Room shape factors
export const SHAPE_FACTORS: Record<string, number> = {
	rectangular: 1.0,
	'L-shaped': 1.10, // +10%
	irregular: 1.15 // +15%
};

// Climate zone factors (legacy)
export const CLIMATE_FACTORS: Record<ClimateZone, number> = {
	tropical: 1.15,
	subtropical: 1.10,
	temperate: 1.0,
	arid: 1.20
};

// Safety margin
export const SAFETY_MARGIN = 0.10; // 10%

// BTU to Tonnage conversion
export const BTU_PER_TON = 12000;

// AC Equipment Catalog - Comprehensive inventory
export const AC_CATALOG: ACUnit[] = [
	// ============================================
	// 9,000 BTU (0.75 TR) - Espacios pequenos
	// ============================================
	{
		id: 'midea-eco-9k',
		brand: 'Midea',
		model: 'Blanc 9K',
		btuCapacity: 9000,
		tonnage: 0.75,
		seer: 13,
		type: 'mini_split',
		features: ['Control remoto', 'Modo sleep', 'Filtro lavable'],
		priceRange: { min: 320, max: 400, currency: 'USD', installationIncluded: false },
		warranty: '3 anos compresor',
		energyRating: 'D'
	},
	{
		id: 'carrier-eco-9k',
		brand: 'Carrier',
		model: 'Comfort 9K',
		btuCapacity: 9000,
		tonnage: 0.75,
		seer: 14,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Timer 24h'],
		priceRange: { min: 350, max: 430, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'lg-rec-9k',
		brand: 'LG',
		model: 'DualCool 9K',
		btuCapacity: 9000,
		tonnage: 0.75,
		seer: 18,
		type: 'mini_split',
		features: ['Dual Inverter', 'WiFi ThinQ', 'Modo silencioso'],
		priceRange: { min: 550, max: 680, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-rec-9k',
		brand: 'Daikin',
		model: 'Cora 9K',
		btuCapacity: 9000,
		tonnage: 0.75,
		seer: 19,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Streamer', 'Sensor inteligente'],
		priceRange: { min: 600, max: 720, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-9k',
		brand: 'Mitsubishi Electric',
		model: 'MSZ-AP09',
		btuCapacity: 9000,
		tonnage: 0.75,
		seer: 22,
		type: 'mini_split',
		features: ['Hyper Inverter', 'Plasma Quad', 'WiFi', '3D i-see'],
		priceRange: { min: 850, max: 1000, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'fujitsu-prem-9k',
		brand: 'Fujitsu',
		model: 'Halcyon 9K',
		btuCapacity: 9000,
		tonnage: 0.75,
		seer: 23,
		type: 'mini_split',
		features: ['Inverter', 'Ion deodorizer', 'WiFi', 'Human sensor'],
		priceRange: { min: 900, max: 1050, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 12,000 BTU (1 TR) - Habitaciones/Oficinas
	// ============================================
	{
		id: 'midea-eco-12k',
		brand: 'Midea',
		model: 'Blanc 12K',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 13,
		type: 'mini_split',
		features: ['Control remoto', 'Modo sleep', 'Filtro lavable'],
		priceRange: { min: 380, max: 480, currency: 'USD', installationIncluded: false },
		warranty: '3 anos compresor',
		energyRating: 'D'
	},
	{
		id: 'carrier-eco-12k',
		brand: 'Carrier',
		model: 'Comfort Series',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 14,
		type: 'mini_split',
		features: ['Control remoto', 'Modo sleep', 'Filtro lavable'],
		priceRange: { min: 450, max: 550, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'lg-eco-12k',
		brand: 'LG',
		model: 'Standard 12K',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Gold Fin'],
		priceRange: { min: 480, max: 580, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'lg-rec-12k',
		brand: 'LG',
		model: 'DualCool 12K',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 18,
		type: 'mini_split',
		features: ['Dual Inverter', 'WiFi ThinQ', 'Modo AI', 'UVnano'],
		priceRange: { min: 650, max: 780, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-rec-12k',
		brand: 'Daikin',
		model: 'Aurora FTXF',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 19,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Modo silencioso', 'Sensor inteligente'],
		priceRange: { min: 700, max: 850, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'carrier-rec-12k',
		brand: 'Carrier',
		model: 'XPower 12K',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 17,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Filtro PM2.5'],
		priceRange: { min: 680, max: 820, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-12k',
		brand: 'Mitsubishi Electric',
		model: 'MSZ-LN',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 24,
		type: 'mini_split',
		features: ['Hyper Inverter', 'Plasma Quad', 'WiFi', '3D Auto', 'Diseno premiado'],
		priceRange: { min: 1100, max: 1300, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-prem-12k',
		brand: 'Daikin',
		model: 'Emura 12K',
		btuCapacity: 12000,
		tonnage: 1,
		seer: 22,
		type: 'mini_split',
		features: ['Flash Streamer', 'WiFi', 'Eye sensor', 'Diseno europeo'],
		priceRange: { min: 1000, max: 1200, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 15,000 BTU (1.25 TR) - Salas medianas
	// ============================================
	{
		id: 'midea-eco-15k',
		brand: 'Midea',
		model: 'Xtreme Save 15K',
		btuCapacity: 15000,
		tonnage: 1.25,
		seer: 14,
		type: 'mini_split',
		features: ['Control remoto', 'Modo turbo', 'Auto limpieza'],
		priceRange: { min: 480, max: 580, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'lg-eco-15k',
		brand: 'LG',
		model: 'Standard Plus 15K',
		btuCapacity: 15000,
		tonnage: 1.25,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Gold Fin', 'Deshumidificador'],
		priceRange: { min: 520, max: 650, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'daikin-rec-15k',
		brand: 'Daikin',
		model: 'Cora 15K',
		btuCapacity: 15000,
		tonnage: 1.25,
		seer: 18,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Streamer', 'Coanda airflow'],
		priceRange: { min: 780, max: 920, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'lg-rec-15k',
		brand: 'LG',
		model: 'DualCool 15K',
		btuCapacity: 15000,
		tonnage: 1.25,
		seer: 19,
		type: 'mini_split',
		features: ['Dual Inverter', 'WiFi ThinQ', 'Purificador de aire'],
		priceRange: { min: 820, max: 980, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-15k',
		brand: 'Mitsubishi Electric',
		model: 'MSZ-EF15',
		btuCapacity: 15000,
		tonnage: 1.25,
		seer: 22,
		type: 'mini_split',
		features: ['Hyper Inverter', 'Plasma Quad', 'WiFi', 'Diseno premium'],
		priceRange: { min: 1200, max: 1400, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 18,000 BTU (1.5 TR) - Salas/Oficinas grandes
	// ============================================
	{
		id: 'midea-eco-18k',
		brand: 'Midea',
		model: 'Xtreme Save 18K',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 14,
		type: 'mini_split',
		features: ['Control remoto', 'Modo turbo', 'Follow me'],
		priceRange: { min: 550, max: 680, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'lg-eco-18k',
		brand: 'LG',
		model: 'Standard Plus',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Deshumidificador'],
		priceRange: { min: 600, max: 750, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'carrier-eco-18k',
		brand: 'Carrier',
		model: 'Comfort 18K',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Timer 24h'],
		priceRange: { min: 580, max: 720, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'daikin-rec-18k',
		brand: 'Daikin',
		model: 'Cora 18K',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 18,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Streamer', 'Sensor movimiento'],
		priceRange: { min: 900, max: 1080, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'lg-rec-18k',
		brand: 'LG',
		model: 'Dual Inverter',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 20,
		type: 'mini_split',
		features: ['Dual Inverter', 'WiFi ThinQ', 'Purificador de aire', 'Modo AI'],
		priceRange: { min: 950, max: 1150, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'carrier-rec-18k',
		brand: 'Carrier',
		model: 'XPower Inverter 18K',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 18,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Filtro HEPA', 'Auto swing'],
		priceRange: { min: 880, max: 1050, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-prem-18k',
		brand: 'Daikin',
		model: 'Emura FTXJ',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 23,
		type: 'mini_split',
		features: ['Flash Streamer', 'WiFi', 'Eye sensor', 'Modo econo', 'Diseno europeo'],
		priceRange: { min: 1500, max: 1800, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-18k',
		brand: 'Mitsubishi Electric',
		model: 'MSZ-LN18',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 24,
		type: 'mini_split',
		features: ['Hyper Inverter', 'Plasma Quad', 'WiFi', '3D i-see', 'Diseno premiado'],
		priceRange: { min: 1600, max: 1900, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 24,000 BTU (2 TR) - Espacios amplios
	// ============================================
	{
		id: 'midea-eco-24k',
		brand: 'Midea',
		model: 'Forest Pro',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Filtro antibacterial', 'Modo turbo'],
		priceRange: { min: 750, max: 900, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'lg-eco-24k',
		brand: 'LG',
		model: 'Standard Plus 24K',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Gold Fin'],
		priceRange: { min: 780, max: 950, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'carrier-eco-24k',
		brand: 'Carrier',
		model: 'Comfort 24K',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 14,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Filtro lavable'],
		priceRange: { min: 720, max: 880, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'daikin-rec-24k',
		brand: 'Daikin',
		model: 'Cora 24K',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 18,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Streamer', 'Coanda airflow'],
		priceRange: { min: 1150, max: 1380, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'carrier-rec-24k',
		brand: 'Carrier',
		model: 'XPower Inverter',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 19,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Filtro HEPA', 'Auto limpieza'],
		priceRange: { min: 1200, max: 1450, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'lg-rec-24k',
		brand: 'LG',
		model: 'Dual Inverter 24K',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 19,
		type: 'mini_split',
		features: ['Dual Inverter', 'WiFi ThinQ', 'UVnano', 'Modo AI'],
		priceRange: { min: 1250, max: 1500, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-24k',
		brand: 'Mitsubishi Electric',
		model: 'MSZ-FH',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 22,
		type: 'mini_split',
		features: ['Hyper Inverter', 'Filtro nanoplatinum', 'Modo 3D', 'WiFi'],
		priceRange: { min: 1900, max: 2300, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-prem-24k',
		brand: 'Daikin',
		model: 'Emura 24K',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 21,
		type: 'mini_split',
		features: ['Flash Streamer', 'WiFi', 'Eye sensor', 'Diseno europeo'],
		priceRange: { min: 1800, max: 2150, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 30,000 BTU (2.5 TR) - Comercial pequeno
	// ============================================
	{
		id: 'lg-eco-30k',
		brand: 'LG',
		model: 'Standard Plus 30K',
		btuCapacity: 30000,
		tonnage: 2.5,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Deshumidificador'],
		priceRange: { min: 950, max: 1150, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'carrier-rec-30k',
		brand: 'Carrier',
		model: 'XPower 30K',
		btuCapacity: 30000,
		tonnage: 2.5,
		seer: 17,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Alta capacidad'],
		priceRange: { min: 1400, max: 1700, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-rec-30k',
		brand: 'Daikin',
		model: 'Skyair 30K',
		btuCapacity: 30000,
		tonnage: 2.5,
		seer: 18,
		type: 'mini_split',
		features: ['Inverter', 'WiFi', 'Control centralizado'],
		priceRange: { min: 1500, max: 1850, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-30k',
		brand: 'Mitsubishi Electric',
		model: 'MSZ-FH30',
		btuCapacity: 30000,
		tonnage: 2.5,
		seer: 21,
		type: 'mini_split',
		features: ['Hyper Inverter', 'Plasma Quad', 'WiFi', '3D i-see'],
		priceRange: { min: 2200, max: 2600, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 36,000 BTU (3 TR) - Comercial/Restaurantes
	// ============================================
	{
		id: 'carrier-eco-36k',
		brand: 'Carrier',
		model: 'Commercial 36K',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 14,
		type: 'mini_split',
		features: ['Control remoto', 'Alta capacidad', 'Modo turbo'],
		priceRange: { min: 1100, max: 1350, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'lg-eco-36k',
		brand: 'LG',
		model: 'Standard Commercial',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 15,
		type: 'mini_split',
		features: ['Control remoto', 'Auto restart', 'Alta capacidad'],
		priceRange: { min: 1200, max: 1450, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'B'
	},
	{
		id: 'daikin-rec-36k',
		brand: 'Daikin',
		model: 'Skyair FBQ',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 18,
		type: 'mini_split',
		features: ['Inverter', 'Alta capacidad', 'Control centralizado'],
		priceRange: { min: 1800, max: 2200, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'lg-rec-36k',
		brand: 'LG',
		model: 'Dual Inverter 36K',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 18,
		type: 'mini_split',
		features: ['Dual Inverter', 'WiFi ThinQ', 'Alta capacidad'],
		priceRange: { min: 1750, max: 2100, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-36k',
		brand: 'Mitsubishi Electric',
		model: 'PEA-M36',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 21,
		type: 'mini_split',
		features: ['Hyper Inverter', 'Comercial', 'WiFi', 'Control zonal'],
		priceRange: { min: 2600, max: 3100, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 48,000 BTU (4 TR) - Comercial grande
	// ============================================
	{
		id: 'carrier-eco-48k',
		brand: 'Carrier',
		model: 'Commercial 48K',
		btuCapacity: 48000,
		tonnage: 4,
		seer: 14,
		type: 'ducted',
		features: ['Ductos', 'Alta capacidad', 'Control basico'],
		priceRange: { min: 2200, max: 2700, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'lg-rec-48k',
		brand: 'LG',
		model: 'Commercial Inverter 48K',
		btuCapacity: 48000,
		tonnage: 4,
		seer: 17,
		type: 'ducted',
		features: ['Inverter', 'Alta capacidad', 'Control centralizado'],
		priceRange: { min: 3200, max: 3800, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-rec-48k',
		brand: 'Daikin',
		model: 'Skyair FBQ 48K',
		btuCapacity: 48000,
		tonnage: 4,
		seer: 18,
		type: 'ducted',
		features: ['Inverter', 'Ductos', 'Control i-manager'],
		priceRange: { min: 3500, max: 4200, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-48k',
		brand: 'Mitsubishi Electric',
		model: 'PEA-M48',
		btuCapacity: 48000,
		tonnage: 4,
		seer: 20,
		type: 'ducted',
		features: ['Hyper Inverter', 'Ductos', 'WiFi', 'Control zonal avanzado'],
		priceRange: { min: 4200, max: 5000, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// 60,000 BTU (5 TR) - Comercial/Industrial
	// ============================================
	{
		id: 'carrier-eco-60k',
		brand: 'Carrier',
		model: '40MBQ060',
		btuCapacity: 60000,
		tonnage: 5,
		seer: 14,
		type: 'ducted',
		features: ['Ductos', 'Alta capacidad', 'Uso comercial'],
		priceRange: { min: 3800, max: 4600, currency: 'USD', installationIncluded: false },
		warranty: '5 anos compresor',
		energyRating: 'C'
	},
	{
		id: 'carrier-rec-60k',
		brand: 'Carrier',
		model: 'XPower Commercial',
		btuCapacity: 60000,
		tonnage: 5,
		seer: 16,
		type: 'ducted',
		features: ['Ductos', 'Alta capacidad', 'Control zonal'],
		priceRange: { min: 4500, max: 5500, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-rec-60k',
		brand: 'Daikin',
		model: 'Skyair Commercial',
		btuCapacity: 60000,
		tonnage: 5,
		seer: 17,
		type: 'ducted',
		features: ['Inverter', 'Ductos', 'BMS compatible'],
		priceRange: { min: 5000, max: 6000, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-prem-60k',
		brand: 'Mitsubishi Electric',
		model: 'PEAD-M60',
		btuCapacity: 60000,
		tonnage: 5,
		seer: 19,
		type: 'ducted',
		features: ['Hyper Inverter', 'Ductos premium', 'Control centralizado', 'BMS'],
		priceRange: { min: 5800, max: 6800, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},

	// ============================================
	// Cassette (Techo) - Comercial
	// ============================================
	{
		id: 'lg-cassette-18k',
		brand: 'LG',
		model: 'Ceiling Cassette 18K',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 16,
		type: 'cassette',
		features: ['4-way airflow', 'Panel plano', 'Control remoto'],
		priceRange: { min: 1200, max: 1500, currency: 'USD', installationIncluded: true },
		warranty: '7 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-cassette-18k',
		brand: 'Daikin',
		model: 'Round Flow 18K',
		btuCapacity: 18000,
		tonnage: 1.5,
		seer: 18,
		type: 'cassette',
		features: ['Round flow', 'Auto swing', 'Sensor presencia'],
		priceRange: { min: 1400, max: 1750, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'lg-cassette-24k',
		brand: 'LG',
		model: 'Ceiling Cassette',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 17,
		type: 'cassette',
		features: ['4-way airflow', 'Panel plano', 'Control remoto'],
		priceRange: { min: 1600, max: 2000, currency: 'USD', installationIncluded: true },
		warranty: '7 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-cassette-24k',
		brand: 'Daikin',
		model: 'Round Flow 24K',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 19,
		type: 'cassette',
		features: ['Round flow', 'Auto swing', 'Sensor presencia', 'WiFi'],
		priceRange: { min: 1900, max: 2350, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-cassette-24k',
		brand: 'Mitsubishi Electric',
		model: 'PLA-M24',
		btuCapacity: 24000,
		tonnage: 2,
		seer: 21,
		type: 'cassette',
		features: ['4-way airflow', 'i-see sensor', 'WiFi', 'Diseno compacto'],
		priceRange: { min: 2200, max: 2700, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-cassette-36k',
		brand: 'Daikin',
		model: 'Round Flow FFQN',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 18,
		type: 'cassette',
		features: ['Round flow', 'Auto swing', 'Sensor presencia'],
		priceRange: { min: 2400, max: 2900, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'lg-cassette-36k',
		brand: 'LG',
		model: 'Ceiling Cassette 36K',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 17,
		type: 'cassette',
		features: ['4-way airflow', 'Panel slim', 'Control inalambrico'],
		priceRange: { min: 2200, max: 2700, currency: 'USD', installationIncluded: true },
		warranty: '7 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'mitsubishi-cassette-36k',
		brand: 'Mitsubishi Electric',
		model: 'PLA-M36',
		btuCapacity: 36000,
		tonnage: 3,
		seer: 20,
		type: 'cassette',
		features: ['4-way airflow', 'i-see sensor 3D', 'WiFi', 'Operacion silenciosa'],
		priceRange: { min: 3000, max: 3600, currency: 'USD', installationIncluded: true },
		warranty: '12 anos compresor',
		energyRating: 'A'
	},
	{
		id: 'daikin-cassette-48k',
		brand: 'Daikin',
		model: 'Round Flow 48K',
		btuCapacity: 48000,
		tonnage: 4,
		seer: 17,
		type: 'cassette',
		features: ['Round flow', 'Alta capacidad', 'Control centralizado'],
		priceRange: { min: 3200, max: 3900, currency: 'USD', installationIncluded: true },
		warranty: '10 anos compresor',
		energyRating: 'A'
	}
];

// Energy cost per kWh (USD) - estimate for Central America
export const ENERGY_COST_PER_KWH = 0.18;

// Hours of operation per month estimates
export const MONTHLY_OPERATING_HOURS: Record<string, number> = {
	morning: 130, // 6h x 22 days
	afternoon: 130,
	full_day: 260, // 12h x 22 days
	evening: 130,
	'24_7': 720 // 24h x 30 days
};

// EER from SEER approximation
export function seerToEer(seer: number): number {
	return seer * 0.875; // Rough approximation
}

// Calculate monthly energy cost
export function calculateMonthlyCost(
	btu: number,
	seer: number,
	hoursPerMonth: number
): number {
	const watts = btu / seerToEer(seer);
	const kWh = (watts / 1000) * hoursPerMonth;
	return Math.round(kWh * ENERGY_COST_PER_KWH * 100) / 100;
}
