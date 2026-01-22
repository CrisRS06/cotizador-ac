import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENROUTER_API_KEY } from '$env/static/private';
import { ROOM_ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from '$lib/prompts/room-analysis';
import type { RoomAnalysis, Language } from '$lib/types';

const OPENROUTER_MODEL = 'x-ai/grok-4.1-fast';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { imageBase64, language = 'es' } = await request.json() as {
			imageBase64: string;
			language?: Language;
		};

		if (!imageBase64) {
			return json({ success: false, error: 'No image provided' }, { status: 400 });
		}

		if (!OPENROUTER_API_KEY) {
			return json({ success: false, error: 'API key not configured' }, { status: 500 });
		}

		// Call OpenRouter API with Grok 4.1 Fast
		const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
				'HTTP-Referer': 'https://cotizador.trybotix.com',
				'X-Title': 'Cotizador AC - Trybotix Labs'
			},
			body: JSON.stringify({
				model: OPENROUTER_MODEL,
				messages: [
					{
						role: 'system',
						content: ROOM_ANALYSIS_SYSTEM_PROMPT
					},
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: buildAnalysisPrompt(language)
							},
							{
								type: 'image_url',
								image_url: {
									url: `data:image/jpeg;base64,${imageBase64}`
								}
							}
						]
					}
				],
				max_tokens: 2000,
				temperature: 0.3
			})
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error('OpenRouter API error:', errorData);
			return json({ success: false, error: 'Analysis failed' }, { status: 500 });
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			return json({ success: false, error: 'No analysis returned' }, { status: 500 });
		}

		// Parse JSON from response
		let analysis: RoomAnalysis;
		try {
			// Try to extract JSON from the response
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				analysis = JSON.parse(jsonMatch[0]);
			} else {
				throw new Error('No JSON found in response');
			}
		} catch (parseError) {
			console.error('JSON parse error:', parseError, 'Content:', content);
			return json({ success: false, error: 'Failed to parse analysis' }, { status: 500 });
		}

		return json({
			success: true,
			analysis
		});

	} catch (error) {
		console.error('Analysis endpoint error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
