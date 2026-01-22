// Room Analysis Types
export interface RoomDimensions {
	width: number; // meters
	length: number; // meters
	height: number; // meters
	area: number; // m²
	volume: number; // m³
}

export interface WindowAnalysis {
	count: number;
	orientation: 'north' | 'south' | 'east' | 'west' | 'unknown';
	hasSolarFilm: boolean;
	approximateArea: number; // m²
}

export interface RoomAnalysis {
	dimensions: RoomDimensions;
	windows: WindowAnalysis;
	roomType: RoomType;
	ceilingType: 'standard' | 'high' | 'exposed' | 'drop';
	hasDirectSunlight: boolean;
	roomShape: 'rectangular' | 'L-shaped' | 'irregular';
	estimatedOccupancy: number;
	detectedEquipment: string[];
	confidenceScore: number; // 0-1
	insights: string[];
}

export type RoomType =
	| 'office'
	| 'conference'
	| 'server_room'
	| 'residential_bedroom'
	| 'residential_living'
	| 'restaurant'
	| 'retail'
	| 'warehouse'
	| 'gym'
	| 'classroom'
	| 'other';

// User Input Types
export interface UserInputs {
	occupants: number;
	operatingHours: 'morning' | 'afternoon' | 'full_day' | 'evening' | '24_7';
	heatGeneratingEquipment: HeatEquipment[];
	climateZone: ClimateZone;
	budgetPreference: 'economic' | 'balanced' | 'premium';
}

export interface HeatEquipment {
	type: 'computer' | 'server' | 'printer' | 'kitchen' | 'lighting' | 'other';
	quantity: number;
	btuPerUnit: number;
}

export type ClimateZone = 'tropical' | 'subtropical' | 'temperate' | 'arid';

// Thermal Calculation Types
export interface ThermalCalculation {
	baseBtu: number;
	occupantBtu: number;
	equipmentBtu: number;
	windowBtu: number;
	sunlightBtu: number;
	ceilingBtu: number;
	safetyMargin: number;
	totalBtu: number;
	tonnage: number;
	breakdown: CalculationBreakdown[];
	// New detailed breakdown by category
	envelopeLoads?: EnvelopeLoads;
	internalLoads?: InternalLoads;
	ventilationLoads?: VentilationLoads;
	latentLoad?: number;
}

export interface CalculationBreakdown {
	category: string;
	categoryEs: string;
	value: number;
	percentage: number;
	description: string;
	descriptionEs: string;
	group?: 'envelope' | 'internal' | 'ventilation' | 'other';
}

// New detailed load structures for professional display
export interface EnvelopeLoads {
	wallTransmission: number;
	roofTransmission: number;
	windowTransmission: number;
	solarGain: number;
	total: number;
}

export interface InternalLoads {
	occupantsSensible: number;
	occupantsLatent: number;
	equipment: number;
	lighting: number;
	total: number;
}

export interface VentilationLoads {
	infiltration: number;
	freshAir: number;
	total: number;
}

// AC Equipment Types
export interface ACUnit {
	id: string;
	brand: string;
	model: string;
	btuCapacity: number;
	tonnage: number;
	seer: number;
	type: 'mini_split' | 'central' | 'cassette' | 'ducted' | 'portable';
	features: string[];
	priceRange: PriceRange;
	warranty: string;
	energyRating: 'A' | 'B' | 'C' | 'D';
	imageUrl?: string;
}

export interface PriceRange {
	min: number;
	max: number;
	currency: 'USD';
	installationIncluded: boolean;
}

// Quote Types
export interface QuoteOption {
	id: string;
	tier: 'economic' | 'recommended' | 'premium';
	units: ACUnit[];
	totalBtu: number;
	coveragePercentage: number;
	estimatedPrice: PriceRange;
	estimatedMonthlyCost: number; // Energy cost
	pros: string[];
	prosEs: string[];
	cons: string[];
	consEs: string[];
	isRecommended: boolean;
}

export interface Quote {
	id: string;
	createdAt: Date;
	analysis: RoomAnalysis;
	userInputs: UserInputs;
	calculation: ThermalCalculation;
	options: QuoteOption[];
	selectedOption?: QuoteOption;
	imageUrl?: string;
}

// Session Types
export interface Session {
	id: string;
	createdAt: Date;
	language: Language;
	mode: 'wizard' | 'chat';
	currentStep: WizardStep;
	imageUrl?: string;
	imageBase64?: string;
	analysis?: RoomAnalysis;
	userInputs?: Partial<UserInputs>;
	calculation?: ThermalCalculation;
	quote?: Quote;
	chatHistory: ChatMessage[];
}

export type Language = 'es' | 'en';

export type WizardStep =
	| 'upload'
	| 'analysis'
	| 'questions'
	| 'calculation'
	| 'quote';

// Chat Types
export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
	imageUrl?: string;
	metadata?: {
		analysisTriggered?: boolean;
		quoteGenerated?: boolean;
	};
}

// API Response Types
export interface AnalyzeRoomResponse {
	success: boolean;
	analysis?: RoomAnalysis;
	error?: string;
}

export interface CalculateResponse {
	success: boolean;
	calculation?: ThermalCalculation;
	options?: QuoteOption[];
	error?: string;
}

export interface UploadResponse {
	success: boolean;
	url?: string;
	error?: string;
}

// Streaming Types
export interface StreamingAnalysis {
	status: 'detecting' | 'measuring' | 'analyzing' | 'complete';
	partial?: Partial<RoomAnalysis>;
	currentInsight?: string;
}
