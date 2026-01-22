import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RoomAnalysis, UserInputs } from '$lib/types';
import { calculateThermalLoad, generateQuoteOptions } from '$lib/services/thermal-calc';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { analysis, userInputs } = await request.json() as {
			analysis: RoomAnalysis;
			userInputs: UserInputs;
		};

		if (!analysis) {
			return json({ success: false, error: 'No analysis provided' }, { status: 400 });
		}

		// Calculate thermal load
		const calculation = calculateThermalLoad(analysis, userInputs || {
			occupants: analysis.estimatedOccupancy,
			operatingHours: 'full_day',
			heatGeneratingEquipment: [],
			climateZone: 'tropical',
			budgetPreference: 'balanced'
		});

		// Generate quote options
		const options = generateQuoteOptions(calculation, userInputs || {
			occupants: analysis.estimatedOccupancy,
			operatingHours: 'full_day',
			heatGeneratingEquipment: [],
			climateZone: 'tropical',
			budgetPreference: 'balanced'
		});

		return json({
			success: true,
			calculation,
			options
		});

	} catch (error) {
		console.error('Calculation endpoint error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
