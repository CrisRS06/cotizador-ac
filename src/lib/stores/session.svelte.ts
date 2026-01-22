import { getContext, setContext } from 'svelte';
import type {
	Session,
	Language,
	WizardStep,
	RoomAnalysis,
	UserInputs,
	ThermalCalculation,
	Quote,
	ChatMessage
} from '$lib/types';
import { detectBrowserLanguage, getTranslations, type TranslationKeys } from '$lib/i18n';

const SESSION_CONTEXT_KEY = Symbol('session');

function generateId(): string {
	return crypto.randomUUID();
}

export function createSessionStore() {
	// Core state with Svelte 5 runes
	let language = $state<Language>(detectBrowserLanguage());
	let mode = $state<'wizard' | 'chat'>('wizard');
	let currentStep = $state<WizardStep>('upload');
	let imageUrl = $state<string | undefined>(undefined);
	let imageBase64 = $state<string | undefined>(undefined);
	let analysis = $state<RoomAnalysis | undefined>(undefined);
	let userInputs = $state<Partial<UserInputs>>({});
	let calculation = $state<ThermalCalculation | undefined>(undefined);
	let quote = $state<Quote | undefined>(undefined);
	let chatHistory = $state<ChatMessage[]>([]);
	let isLoading = $state(false);
	let error = $state<string | undefined>(undefined);

	// Chat-specific state for thermal calculations
	let chatAnalysis = $state<RoomAnalysis | undefined>(undefined);
	let chatUserInputs = $state<Partial<UserInputs>>({});
	let chatQuote = $state<Quote | undefined>(undefined);
	let chatImageUrl = $state<string | undefined>(undefined);
	let chatWantsQuote = $state(false); // User confirmed they want a quote

	// Derived: Check if chat has all required info for quote
	const chatHasAllInfo = $derived(
		chatAnalysis !== undefined &&
			chatAnalysis.dimensions.area > 0 &&
			(chatUserInputs.occupants !== undefined || chatAnalysis.estimatedOccupancy > 0)
	);

	// Derived: Check if ready to show quote button (needs info + user confirmation)
	const chatReadyForQuote = $derived(chatHasAllInfo && chatWantsQuote);

	// Derived state
	const translations = $derived<TranslationKeys>(getTranslations(language));
	const sessionId = $derived(generateId());

	const session = $derived<Session>({
		id: sessionId,
		createdAt: new Date(),
		language,
		mode,
		currentStep,
		imageUrl,
		imageBase64,
		analysis,
		userInputs,
		calculation,
		quote,
		chatHistory
	});

	// Actions
	function setLanguage(lang: Language) {
		language = lang;
		// Persist preference
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('cotizador-lang', lang);
		}
	}

	function setMode(newMode: 'wizard' | 'chat') {
		mode = newMode;
	}

	function setStep(step: WizardStep) {
		currentStep = step;
	}

	function nextStep() {
		const steps: WizardStep[] = ['upload', 'analysis', 'questions', 'calculation', 'quote'];
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex < steps.length - 1) {
			currentStep = steps[currentIndex + 1];
		}
	}

	function prevStep() {
		const steps: WizardStep[] = ['upload', 'analysis', 'questions', 'calculation', 'quote'];
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex > 0) {
			currentStep = steps[currentIndex - 1];
		}
	}

	function setImage(url: string, base64?: string) {
		imageUrl = url;
		imageBase64 = base64;
	}

	function setAnalysis(newAnalysis: RoomAnalysis) {
		analysis = newAnalysis;
	}

	function updateAnalysis(updates: Partial<RoomAnalysis>) {
		if (analysis) {
			analysis = { ...analysis, ...updates };
		}
	}

	function setUserInputs(inputs: Partial<UserInputs>) {
		userInputs = { ...userInputs, ...inputs };
	}

	function setCalculation(calc: ThermalCalculation) {
		calculation = calc;
	}

	function setQuote(newQuote: Quote) {
		quote = newQuote;
	}

	function addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
		chatHistory = [
			...chatHistory,
			{
				...message,
				id: generateId(),
				timestamp: new Date()
			}
		];
	}

	function setChatAnalysis(newAnalysis: RoomAnalysis) {
		chatAnalysis = newAnalysis;
	}

	function updateChatUserInputs(inputs: Partial<UserInputs>) {
		chatUserInputs = { ...chatUserInputs, ...inputs };
	}

	function setChatQuote(newQuote: Quote) {
		chatQuote = newQuote;
	}

	function setChatImageUrl(url: string | undefined) {
		chatImageUrl = url;
	}

	function setChatWantsQuote(value: boolean) {
		chatWantsQuote = value;
	}

	function resetChat() {
		chatAnalysis = undefined;
		chatUserInputs = {};
		chatQuote = undefined;
		chatImageUrl = undefined;
		chatWantsQuote = false;
		chatHistory = [];
	}

	function setLoading(loading: boolean) {
		isLoading = loading;
	}

	function setError(err: string | undefined) {
		error = err;
	}

	function reset() {
		mode = 'wizard';
		currentStep = 'upload';
		imageUrl = undefined;
		imageBase64 = undefined;
		analysis = undefined;
		userInputs = {};
		calculation = undefined;
		quote = undefined;
		chatHistory = [];
		isLoading = false;
		error = undefined;
		// Also reset chat-specific state
		chatAnalysis = undefined;
		chatUserInputs = {};
		chatQuote = undefined;
		chatImageUrl = undefined;
		chatWantsQuote = false;
	}

	// Initialize language from localStorage
	if (typeof localStorage !== 'undefined') {
		const savedLang = localStorage.getItem('cotizador-lang') as Language | null;
		if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
			language = savedLang;
		}
	}

	return {
		// Getters (using get functions to work with $state)
		get language() {
			return language;
		},
		get mode() {
			return mode;
		},
		get currentStep() {
			return currentStep;
		},
		get imageUrl() {
			return imageUrl;
		},
		get imageBase64() {
			return imageBase64;
		},
		get analysis() {
			return analysis;
		},
		get userInputs() {
			return userInputs;
		},
		get calculation() {
			return calculation;
		},
		get quote() {
			return quote;
		},
		get chatHistory() {
			return chatHistory;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get translations() {
			return translations;
		},
		get session() {
			return session;
		},
		// Chat-specific getters
		get chatAnalysis() {
			return chatAnalysis;
		},
		get chatUserInputs() {
			return chatUserInputs;
		},
		get chatQuote() {
			return chatQuote;
		},
		get chatImageUrl() {
			return chatImageUrl;
		},
		get chatWantsQuote() {
			return chatWantsQuote;
		},
		get chatHasAllInfo() {
			return chatHasAllInfo;
		},
		get chatReadyForQuote() {
			return chatReadyForQuote;
		},

		// Actions
		setLanguage,
		setMode,
		setStep,
		nextStep,
		prevStep,
		setImage,
		setAnalysis,
		updateAnalysis,
		setUserInputs,
		setCalculation,
		setQuote,
		addChatMessage,
		setLoading,
		setError,
		reset,
		// Chat-specific actions
		setChatAnalysis,
		updateChatUserInputs,
		setChatQuote,
		setChatImageUrl,
		setChatWantsQuote,
		resetChat
	};
}

export type SessionStore = ReturnType<typeof createSessionStore>;

export function setSessionContext(store: SessionStore) {
	setContext(SESSION_CONTEXT_KEY, store);
}

export function getSessionContext(): SessionStore {
	const store = getContext<SessionStore>(SESSION_CONTEXT_KEY);
	if (!store) {
		throw new Error('Session context not found. Make sure to call setSessionContext in a parent component.');
	}
	return store;
}
