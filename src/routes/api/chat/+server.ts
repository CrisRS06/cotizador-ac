import type { RequestHandler } from './$types';
import { streamText } from 'ai';
import { getGrok } from '$lib/ai/openrouter';
import { CHAT_SYSTEM_PROMPT } from '$lib/prompts/room-analysis';
import type { ChatMessage } from '$lib/types';

interface ChatRequest {
	messages: ChatMessage[];
	language: 'es' | 'en';
	imageBase64?: string;
	context?: {
		hasAnalysis: boolean;
		analysis?: {
			roomType: string;
			area: number;
			windows: number;
			estimatedOccupancy: number;
		};
		userInputs?: Record<string, unknown>;
	};
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages, language, imageBase64, context } = (await request.json()) as ChatRequest;

		if (!messages || messages.length === 0) {
			return new Response(JSON.stringify({ success: false, error: 'No messages provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Build messages for API - use any[] to avoid complex AI SDK type issues
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const apiMessages: any[] = [];

		// Add conversation history
		for (const msg of messages) {
			if (msg.role === 'user') {
				// Check if this is the last message and has an image
				if (msg === messages[messages.length - 1] && imageBase64) {
					apiMessages.push({
						role: 'user',
						content: [
							{ type: 'text', text: msg.content },
							{
								type: 'image',
								image: `data:image/jpeg;base64,${imageBase64}`
							}
						]
					});
				} else {
					// User messages can use string content
					apiMessages.push({
						role: 'user',
						content: msg.content
					});
				}
			} else {
				// Assistant messages MUST use string content (not array)
				apiMessages.push({
					role: 'assistant',
					content: msg.content
				});
			}
		}

		// Build enhanced system prompt with context if available
		let systemPrompt = CHAT_SYSTEM_PROMPT;
		if (context?.hasAnalysis && context.analysis) {
			const hasOccupants = !!(context.userInputs?.occupants || context.analysis.estimatedOccupancy > 0);
			const hasWindowInfo = context.analysis.windows > 0 ||
				(context.analysis as Record<string, unknown>).windowsConfirmed === true;
			const hasEquipmentInfo = (context.analysis as Record<string, unknown>).equipmentAsked === true;
			const buttonAvailable = context.analysis.area > 0 && hasOccupants;

			// Build status of what info we have
			const missingInfo: string[] = [];
			if (!hasOccupants) missingInfo.push('ocupantes');
			if (!hasWindowInfo) missingInfo.push('ventanas (cuantas y orientacion)');
			if (!hasEquipmentInfo) missingInfo.push('equipos que generen calor');

			systemPrompt += `\n\n## CONTEXTO ACTUAL DE LA SESION:
- Dimensiones: SI (${context.analysis.area}m²)
- Tipo de espacio: ${context.analysis.roomType}
- Ocupantes: ${context.userInputs?.occupants ? `${context.userInputs.occupants} (confirmados)` : context.analysis.estimatedOccupancy > 0 ? `${context.analysis.estimatedOccupancy} (estimados)` : 'NO CONFIRMADOS - DEBES PREGUNTAR'}
- Ventanas: ${context.analysis.windows > 0 ? `${context.analysis.windows} detectadas` : 'NO CONFIRMADAS - DEBES PREGUNTAR cuantas y orientacion'}
- Equipos: ${hasEquipmentInfo ? 'Preguntado' : 'NO PREGUNTADO - DEBES PREGUNTAR sobre computadoras/equipos'}

**ESTADO DEL BOTON:** ${buttonAvailable ? 'VISIBLE para el usuario' : 'OCULTO - Falta: ' + missingInfo.join(', ')}

**PROXIMA PREGUNTA SUGERIDA:** ${!hasOccupants ? '¿Cuantas personas usan el espacio?' : !hasWindowInfo ? '¿Cuantas ventanas tiene y hacia donde dan?' : !hasEquipmentInfo ? '¿Tienen computadoras u otros equipos que generen calor?' : 'Informacion completa - puedes mencionar el boton'}`;
		} else {
			systemPrompt += `\n\n## CONTEXTO ACTUAL DE LA SESION:
- Dimensiones: NO DISPONIBLES
- El boton "Generar Cotizacion" NO ESTA VISIBLE

**IMPORTANTE:** El usuario NO ha proporcionado dimensiones. DEBES preguntar por el tamano del espacio.
Ejemplo: "¿Podrias decirme el tamano aproximado? Por ejemplo: '4x5 metros' o '20 metros cuadrados'."`;
		}

		// Stream response using Vercel AI SDK with lazy-initialized model
		const result = streamText({
			model: getGrok(),
			system: systemPrompt,
			messages: apiMessages
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error('Chat endpoint error:', error);
		return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
