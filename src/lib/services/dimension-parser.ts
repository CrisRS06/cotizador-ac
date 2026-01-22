import type { RoomAnalysis, RoomType } from '$lib/types';

/**
 * Parsed room information from user text input
 */
export interface ParsedRoomInfo {
	dimensions?: {
		width?: number;
		length?: number;
		height?: number;
		area?: number;
	};
	roomType?: RoomType;
	occupants?: number;
	windows?: {
		count?: number;
		orientation?: 'north' | 'south' | 'east' | 'west';
		hasSolarFilm?: boolean;
	};
	equipment?: string[];
	hasDirectSunlight?: boolean;
}

// Regex patterns for dimension extraction
const DIMENSION_3D =
	/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:m(?:etros?)?)?/i;
const DIMENSION_2D =
	/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:m(?:etros?)?)?(?!\s*[x×])/i;
const AREA_PATTERN = /(\d+(?:[.,]\d+)?)\s*(?:m[²2]|metros?\s*cuadrados?|square\s*meters?)/i;
const HEIGHT_PATTERN =
	/(?:altura|alto|height|techo)[^\d]*(\d+(?:[.,]\d+)?)\s*(?:m(?:etros?)?)?/i;
const OCCUPANTS_PATTERN =
	/(\d{1,2})\s*(?:personas?|people|ocupantes?|occupants?|trabajadores?|employees?)/i;

// Window patterns
const WINDOW_COUNT_PATTERN = /(\d{1,2})\s*(?:ventanas?|windows?)/i;
const NO_WINDOWS_PATTERN = /(?:sin\s*ventanas?|no\s*(?:tiene[n]?\s*)?ventanas?|no\s*windows?|ninguna\s*ventana)/i;
const WINDOW_ORIENTATION_PATTERN = /(?:ventanas?\s*(?:al|hacia|orientadas?\s*(?:al|hacia)?)?|windows?\s*(?:facing|oriented?)?\s*(?:to\s*the)?)\s*(norte|sur|este|oeste|north|south|east|west)/i;
const SOLAR_FILM_PATTERN = /(?:pelicula\s*solar|filtro\s*solar|vidrio\s*(?:tintado|polarizado)|solar\s*film|tinted\s*(?:glass|windows?))/i;
const NO_SOLAR_FILM_PATTERN = /(?:sin\s*(?:pelicula|filtro)\s*solar|no\s*(?:tiene[n]?\s*)?(?:pelicula|filtro)\s*solar|vidrio\s*(?:normal|transparente)|no\s*solar\s*film|clear\s*glass)/i;

// Equipment patterns
const COMPUTER_PATTERN = /(\d{1,2})?\s*(?:computadoras?|computers?|pcs?|laptops?|portatil(?:es)?)/i;
const SERVER_PATTERN = /(\d{1,2})?\s*(?:servidores?|servers?|racks?)/i;
const PRINTER_PATTERN = /(\d{1,2})?\s*(?:impresoras?|printers?)/i;
const KITCHEN_PATTERN = /(?:cocina|estufa|horno|microondas|kitchen|stove|oven|microwave)/i;

// Sunlight pattern
const SUNLIGHT_PATTERN = /(?:sol\s*directo|luz\s*(?:solar\s*)?directa|direct\s*sun(?:light)?|mucho\s*sol)/i;
const NO_SUNLIGHT_PATTERN = /(?:sin\s*sol\s*directo|no\s*(?:le\s*)?da\s*(?:el\s*)?sol|sombra|no\s*direct\s*sun|shaded)/i;

// Room type detection patterns
const ROOM_TYPE_PATTERNS: { pattern: RegExp; type: RoomType }[] = [
	{ pattern: /\b(?:oficina|office|despacho)\b/i, type: 'office' },
	{ pattern: /\b(?:sala\s*de\s*juntas|conference|conferencias|reunion(?:es)?|meeting)\b/i, type: 'conference' },
	{ pattern: /\b(?:servidor(?:es)?|server|datacenter|data\s*center)\b/i, type: 'server_room' },
	{ pattern: /\b(?:dormitorio|bedroom|recamara|habitacion|cuarto)\b/i, type: 'residential_bedroom' },
	{ pattern: /\b(?:sala|living|estancia|comedor)\b/i, type: 'residential_living' },
	{ pattern: /\b(?:restaurante|restaurant|cocina\s*comercial)\b/i, type: 'restaurant' },
	{ pattern: /\b(?:tienda|retail|comercio|local\s*comercial|shop|store)\b/i, type: 'retail' },
	{ pattern: /\b(?:bodega|warehouse|almacen|almacén)\b/i, type: 'warehouse' },
	{ pattern: /\b(?:gimnasio|gym)\b/i, type: 'gym' },
	{ pattern: /\b(?:salon\s*de\s*clases|classroom|aula|escuela)\b/i, type: 'classroom' }
];

/**
 * Parse a number from text, handling both period and comma as decimal separators
 */
function parseNumber(str: string): number {
	// Replace comma with period for decimal parsing
	return parseFloat(str.replace(',', '.'));
}

/**
 * Parse dimensions and room info from natural language text
 */
export function parseDimensionsFromText(text: string): ParsedRoomInfo {
	const result: ParsedRoomInfo = {};

	// Try 3D dimensions first (e.g., "4x5x3m")
	const match3D = text.match(DIMENSION_3D);
	if (match3D) {
		const width = parseNumber(match3D[1]);
		const length = parseNumber(match3D[2]);
		const height = parseNumber(match3D[3]);
		result.dimensions = {
			width,
			length,
			height,
			area: width * length
		};
	}

	// Try 2D dimensions (e.g., "4x5m") - only if no 3D match
	if (!result.dimensions) {
		const match2D = text.match(DIMENSION_2D);
		if (match2D) {
			const width = parseNumber(match2D[1]);
			const length = parseNumber(match2D[2]);
			result.dimensions = {
				width,
				length,
				area: width * length
			};
		}
	}

	// Try area only (e.g., "20m²")
	if (!result.dimensions?.area) {
		const matchArea = text.match(AREA_PATTERN);
		if (matchArea) {
			const area = parseNumber(matchArea[1]);
			// Estimate dimensions as a square root approximation
			const side = Math.sqrt(area);
			result.dimensions = {
				width: Math.round(side * 10) / 10,
				length: Math.round(side * 10) / 10,
				area
			};
		}
	}

	// Try to extract height separately (e.g., "altura de 3m")
	if (result.dimensions && !result.dimensions.height) {
		const matchHeight = text.match(HEIGHT_PATTERN);
		if (matchHeight) {
			result.dimensions.height = parseNumber(matchHeight[1]);
		}
	}

	// Extract room type
	for (const { pattern, type } of ROOM_TYPE_PATTERNS) {
		if (pattern.test(text)) {
			result.roomType = type;
			break;
		}
	}

	// Extract occupants
	const matchOccupants = text.match(OCCUPANTS_PATTERN);
	if (matchOccupants) {
		result.occupants = parseInt(matchOccupants[1], 10);
	}

	// Extract window information
	if (NO_WINDOWS_PATTERN.test(text)) {
		result.windows = { count: 0 };
	} else {
		const windowCountMatch = text.match(WINDOW_COUNT_PATTERN);
		if (windowCountMatch) {
			result.windows = result.windows || {};
			result.windows.count = parseInt(windowCountMatch[1], 10);
		}
	}

	// Extract window orientation
	const orientationMatch = text.match(WINDOW_ORIENTATION_PATTERN);
	if (orientationMatch) {
		result.windows = result.windows || {};
		const dir = orientationMatch[1].toLowerCase();
		const orientationMap: Record<string, 'north' | 'south' | 'east' | 'west'> = {
			norte: 'north',
			north: 'north',
			sur: 'south',
			south: 'south',
			este: 'east',
			east: 'east',
			oeste: 'west',
			west: 'west'
		};
		result.windows.orientation = orientationMap[dir];
	}

	// Extract solar film info
	if (SOLAR_FILM_PATTERN.test(text)) {
		result.windows = result.windows || {};
		result.windows.hasSolarFilm = true;
	} else if (NO_SOLAR_FILM_PATTERN.test(text)) {
		result.windows = result.windows || {};
		result.windows.hasSolarFilm = false;
	}

	// Extract equipment
	const equipment: string[] = [];
	const computerMatch = text.match(COMPUTER_PATTERN);
	if (computerMatch) {
		const count = computerMatch[1] ? parseInt(computerMatch[1], 10) : 1;
		for (let i = 0; i < count; i++) equipment.push('computer');
	}
	const serverMatch = text.match(SERVER_PATTERN);
	if (serverMatch) {
		const count = serverMatch[1] ? parseInt(serverMatch[1], 10) : 1;
		for (let i = 0; i < count; i++) equipment.push('server');
	}
	const printerMatch = text.match(PRINTER_PATTERN);
	if (printerMatch) {
		const count = printerMatch[1] ? parseInt(printerMatch[1], 10) : 1;
		for (let i = 0; i < count; i++) equipment.push('printer');
	}
	if (KITCHEN_PATTERN.test(text)) {
		equipment.push('kitchen');
	}
	if (equipment.length > 0) {
		result.equipment = equipment;
	}

	// Extract sunlight info
	if (SUNLIGHT_PATTERN.test(text)) {
		result.hasDirectSunlight = true;
	} else if (NO_SUNLIGHT_PATTERN.test(text)) {
		result.hasDirectSunlight = false;
	}

	return result;
}

/**
 * Create a synthetic RoomAnalysis object from parsed text info
 * Uses placeholder values that indicate "not yet asked" vs "confirmed"
 */
export function createSyntheticAnalysis(
	parsed: ParsedRoomInfo,
	language: 'es' | 'en'
): RoomAnalysis {
	const area = parsed.dimensions?.area ?? 20;
	const width = parsed.dimensions?.width ?? Math.sqrt(area);
	const length = parsed.dimensions?.length ?? Math.sqrt(area);
	const height = parsed.dimensions?.height ?? 2.7; // Default ceiling height

	// Default room type based on area if not detected
	let roomType = parsed.roomType;
	if (!roomType) {
		if (area <= 15) {
			roomType = 'residential_bedroom';
		} else if (area <= 30) {
			roomType = 'office';
		} else {
			roomType = 'other';
		}
	}

	// Determine window info (use parsed or defaults)
	const windowCount = parsed.windows?.count ?? -1; // -1 means "not yet asked"
	const windowOrientation = parsed.windows?.orientation ?? 'unknown';
	const hasSolarFilm = parsed.windows?.hasSolarFilm ?? false;

	// Generate default insights based on detected info
	const insights: string[] = [];
	if (language === 'es') {
		if (height && height > 3) {
			insights.push('Techo alto detectado - puede requerir mayor capacidad de enfriamiento');
		}
		if (area > 40) {
			insights.push('Espacio grande - considerar equipo de alta capacidad o multiples unidades');
		}
		insights.push('Dimensiones proporcionadas por el usuario (sin analisis de imagen)');
	} else {
		if (height && height > 3) {
			insights.push('High ceiling detected - may require increased cooling capacity');
		}
		if (area > 40) {
			insights.push('Large space - consider high capacity unit or multiple units');
		}
		insights.push('Dimensions provided by user (no image analysis)');
	}

	return {
		dimensions: {
			width: Math.round(width * 10) / 10,
			length: Math.round(length * 10) / 10,
			height: Math.round(height * 10) / 10,
			area: Math.round(area * 10) / 10,
			volume: Math.round(width * length * height * 10) / 10
		},
		windows: {
			count: windowCount >= 0 ? windowCount : 1, // Use 1 as conservative default if not specified
			orientation: windowOrientation,
			hasSolarFilm,
			approximateArea: windowCount >= 0 ? windowCount * 2 : 2 // 2m² per window
		},
		roomType,
		ceilingType: height > 3.5 ? 'high' : 'standard',
		hasDirectSunlight: parsed.hasDirectSunlight ?? false,
		roomShape: 'rectangular',
		estimatedOccupancy: parsed.occupants ?? 0,
		detectedEquipment: parsed.equipment ?? [],
		confidenceScore: 0.6, // Lower confidence since it's from text
		insights
	};
}

/**
 * Update an existing RoomAnalysis with new parsed info from follow-up messages
 */
export function updateAnalysisFromText(
	existingAnalysis: RoomAnalysis,
	parsed: ParsedRoomInfo
): RoomAnalysis {
	const updated = { ...existingAnalysis };

	// Update occupants if provided
	if (parsed.occupants !== undefined) {
		updated.estimatedOccupancy = parsed.occupants;
	}

	// Update windows if provided
	if (parsed.windows) {
		updated.windows = { ...updated.windows };
		if (parsed.windows.count !== undefined) {
			updated.windows.count = parsed.windows.count;
			updated.windows.approximateArea = parsed.windows.count * 2;
		}
		if (parsed.windows.orientation !== undefined) {
			updated.windows.orientation = parsed.windows.orientation;
		}
		if (parsed.windows.hasSolarFilm !== undefined) {
			updated.windows.hasSolarFilm = parsed.windows.hasSolarFilm;
		}
	}

	// Update equipment if provided
	if (parsed.equipment && parsed.equipment.length > 0) {
		// Merge with existing, avoiding duplicates
		const existingSet = new Set(updated.detectedEquipment);
		for (const eq of parsed.equipment) {
			existingSet.add(eq);
		}
		updated.detectedEquipment = Array.from(existingSet);
	}

	// Update sunlight if explicitly mentioned
	if (parsed.hasDirectSunlight !== undefined) {
		updated.hasDirectSunlight = parsed.hasDirectSunlight;
	}

	// Update room type if provided
	if (parsed.roomType) {
		updated.roomType = parsed.roomType;
	}

	return updated;
}

/**
 * Check what information is still missing for a complete analysis
 */
export function getMissingInfo(analysis: RoomAnalysis | undefined, occupants: number | undefined): {
	hasDimensions: boolean;
	hasOccupants: boolean;
	hasWindowInfo: boolean;
	hasEquipmentInfo: boolean;
	allRequired: boolean;
	allOptional: boolean;
} {
	const hasDimensions = analysis !== undefined && analysis.dimensions.area > 0;
	const hasOccupants = (occupants !== undefined && occupants > 0) ||
		(analysis !== undefined && analysis.estimatedOccupancy > 0);
	// Window info is "known" if count is not the default placeholder or orientation is known
	const hasWindowInfo = analysis !== undefined &&
		(analysis.windows.count >= 0 || analysis.windows.orientation !== 'unknown');
	// Equipment info is "known" if any equipment detected OR we've explicitly asked
	const hasEquipmentInfo = analysis !== undefined && analysis.detectedEquipment.length >= 0;

	return {
		hasDimensions,
		hasOccupants,
		hasWindowInfo,
		hasEquipmentInfo,
		allRequired: hasDimensions && hasOccupants,
		allOptional: hasWindowInfo && hasEquipmentInfo
	};
}
