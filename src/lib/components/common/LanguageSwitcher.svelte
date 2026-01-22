<script lang="ts">
	import { getSessionContext } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import type { Language } from '$lib/types';

	const session = getSessionContext();

	function toggleLanguage() {
		const newLang: Language = session.language === 'es' ? 'en' : 'es';
		session.setLanguage(newLang);
	}
</script>

<button
	onclick={toggleLanguage}
	class={cn(
		'flex items-center gap-1.5 rounded-full px-3 py-1.5',
		'glass border border-border-subtle',
		'text-sm font-medium text-foreground-muted',
		'hover:text-foreground hover:border-accent-500/30 transition-all duration-200',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500'
	)}
	aria-label={session.language === 'es' ? 'Switch to English' : 'Cambiar a Espanol'}
>
	<span class="text-base" aria-hidden="true">
		{session.language === 'es' ? '🇪🇸' : '🇺🇸'}
	</span>
	<span class="uppercase tracking-wide">
		{session.language === 'es' ? 'ES' : 'EN'}
	</span>
</button>
