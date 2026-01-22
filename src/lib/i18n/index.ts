import type { Language } from '$lib/types';
import es from './es.json';
import en from './en.json';

export type TranslationKeys = typeof es;

const translations: Record<Language, TranslationKeys> = {
	es,
	en
};

export function getTranslations(lang: Language): TranslationKeys {
	return translations[lang];
}

export function t(lang: Language, path: string): string {
	const keys = path.split('.');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let result: any = translations[lang];

	for (const key of keys) {
		if (result && typeof result === 'object' && key in result) {
			result = result[key];
		} else {
			console.warn(`Translation not found: ${path} for language: ${lang}`);
			return path;
		}
	}

	return typeof result === 'string' ? result : path;
}

export function detectBrowserLanguage(): Language {
	if (typeof navigator === 'undefined') return 'es';

	const browserLang = navigator.language.toLowerCase();

	if (browserLang.startsWith('es')) return 'es';
	if (browserLang.startsWith('en')) return 'en';

	// Default to Spanish for Latin American markets
	return 'es';
}

export { es, en };
