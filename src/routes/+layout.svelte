<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { createSessionStore, setSessionContext } from '$lib/stores/session.svelte';
	// @ts-ignore - virtual module provided by vite-pwa
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	// Create and provide session store
	const sessionStore = createSessionStore();
	setSessionContext(sessionStore);

	// PWA web manifest
	$effect(() => {
		if (pwaInfo) {
			const { webManifest } = pwaInfo;
			if (webManifest) {
				const link = document.querySelector('link[rel="manifest"]');
				if (!link) {
					const newLink = document.createElement('link');
					newLink.rel = 'manifest';
					newLink.href = webManifest.href;
					document.head.appendChild(newLink);
				}
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
	<title>{sessionStore.translations.app.title} - Trybotix Labs</title>
	<meta name="description" content={sessionStore.translations.app.subtitle} />
</svelte:head>

{@render children()}
