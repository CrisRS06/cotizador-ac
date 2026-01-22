import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { OPENROUTER_API_KEY } from '$env/static/private';

const OPENROUTER_MODEL = 'x-ai/grok-4.1-fast';

/**
 * Create OpenRouter provider instance (lazy initialization)
 */
function getOpenRouterProvider() {
	if (!OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is not configured');
	}

	return createOpenRouter({
		apiKey: OPENROUTER_API_KEY,
		headers: {
			'HTTP-Referer': 'https://cotizador.trybotix.com',
			'X-Title': 'Cotizador AC - Trybotix Labs'
		}
	});
}

/**
 * Get Grok 4.1 Fast model instance (lazy initialization)
 */
export function getGrok() {
	const provider = getOpenRouterProvider();
	return provider.chat(OPENROUTER_MODEL);
}

/**
 * Get any model from OpenRouter (lazy initialization)
 */
export function getModel(modelId?: string) {
	const provider = getOpenRouterProvider();
	return provider.chat(modelId || OPENROUTER_MODEL);
}
