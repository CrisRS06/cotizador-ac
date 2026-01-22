<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSessionContext } from '$lib/stores/session.svelte';
	import PhotoUploader from '$lib/components/wizard/PhotoUploader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowRight } from 'lucide-svelte';

	const session = getSessionContext();
	const t = session.translations.wizard.upload;

	let hasImage = $state(false);
	let isUploading = $state(false);

	async function handleImageSelected(file: File, base64: string, previewUrl: string) {
		session.setImage(previewUrl, base64);
		hasImage = true;
	}

	async function proceed() {
		if (!session.imageBase64) return;

		isUploading = true;
		try {
			session.setStep('analysis');
			goto('/wizard/analysis');
		} catch (error) {
			console.error('Upload error:', error);
			session.setError(session.translations.errors.upload_failed);
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="space-y-8 animate-fade-in">
	<!-- Title -->
	<div class="text-center">
		<h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-3">
			{t.title}
		</h1>
		<p class="text-foreground-muted">
			{t.subtitle}
		</p>
	</div>

	<!-- Photo Uploader -->
	<PhotoUploader onImageSelected={handleImageSelected} />

	<!-- Continue Button -->
	{#if hasImage}
		<div class="animate-slide-up">
			<Button
				variant="primary"
				size="lg"
				onclick={proceed}
				loading={isUploading}
				disabled={isUploading}
				class="w-full"
			>
				{session.translations.app.next}
				<ArrowRight class="h-5 w-5" />
			</Button>
		</div>
	{/if}
</div>
