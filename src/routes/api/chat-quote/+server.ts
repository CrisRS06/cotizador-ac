import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RoomAnalysis, UserInputs, Quote } from '$lib/types';
import { calculateThermalLoad, generateQuoteOptions } from '$lib/services/thermal-calc';

interface ChatQuoteRequest {
	analysis: RoomAnalysis;
	userInputs?: Partial<UserInputs>;
	imageUrl?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { analysis, userInputs = {}, imageUrl } = (await request.json()) as ChatQuoteRequest;

		if (!analysis) {
			return json({ success: false, error: 'No analysis provided' }, { status: 400 });
		}

		// Complete userInputs with defaults based on analysis
		const completeUserInputs: UserInputs = {
			occupants: userInputs.occupants ?? analysis.estimatedOccupancy ?? 2,
			operatingHours: userInputs.operatingHours ?? 'full_day',
			heatGeneratingEquipment: userInputs.heatGeneratingEquipment ?? [],
			climateZone: userInputs.climateZone ?? 'tropical',
			budgetPreference: userInputs.budgetPreference ?? 'balanced'
		};

		// Add detected equipment from analysis if not already specified
		if (
			completeUserInputs.heatGeneratingEquipment.length === 0 &&
			analysis.detectedEquipment.length > 0
		) {
			completeUserInputs.heatGeneratingEquipment = analysis.detectedEquipment.map((equipment) => ({
				type: equipment as 'computer' | 'server' | 'printer' | 'kitchen' | 'lighting' | 'other',
				quantity: 1,
				btuPerUnit: 300 // Default value, actual BTU calculated in thermal-calc
			}));
		}

		// Calculate thermal load using the same service as wizard
		const calculation = calculateThermalLoad(analysis, completeUserInputs);

		// Generate quote options using the same service as wizard
		const options = generateQuoteOptions(calculation, completeUserInputs);

		// Build complete quote object
		const quote: Quote = {
			id: crypto.randomUUID(),
			createdAt: new Date(),
			analysis,
			userInputs: completeUserInputs,
			calculation,
			options,
			imageUrl
		};

		return json({
			success: true,
			quote,
			calculation,
			options
		});
	} catch (error) {
		console.error('Chat quote endpoint error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
