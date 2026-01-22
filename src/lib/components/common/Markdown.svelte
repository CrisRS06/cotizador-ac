<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let { content = '' }: { content?: string } = $props();

	// Configure marked for safe rendering
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	const html = $derived(() => {
		if (!content) return '';
		const rawHtml = marked.parse(content, { async: false }) as string;
		return DOMPurify.sanitize(rawHtml);
	});
</script>

<div class="markdown-content prose prose-sm max-w-none">
	{@html html()}
</div>

<style>
	.markdown-content :global(p) {
		margin-bottom: 0.5rem;
	}

	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.25rem;
	}

	.markdown-content :global(li) {
		margin-bottom: 0.25rem;
	}

	.markdown-content :global(strong) {
		font-weight: 600;
	}

	.markdown-content :global(code) {
		background-color: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}

	.markdown-content :global(pre) {
		background-color: rgba(0, 0, 0, 0.05);
		padding: 0.75rem;
		border-radius: 0.375rem;
		overflow-x: auto;
		margin: 0.5rem 0;
	}

	.markdown-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.markdown-content :global(h1),
	.markdown-content :global(h2),
	.markdown-content :global(h3) {
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.markdown-content :global(h1) {
		font-size: 1.25rem;
	}

	.markdown-content :global(h2) {
		font-size: 1.125rem;
	}

	.markdown-content :global(h3) {
		font-size: 1rem;
	}

	.markdown-content :global(blockquote) {
		border-left: 3px solid #e5e7eb;
		padding-left: 0.75rem;
		margin: 0.5rem 0;
		color: #6b7280;
	}

	.markdown-content :global(a) {
		color: #2563eb;
		text-decoration: underline;
	}

	.markdown-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.5rem 0;
	}

	.markdown-content :global(th),
	.markdown-content :global(td) {
		border: 1px solid #e5e7eb;
		padding: 0.5rem;
		text-align: left;
	}

	.markdown-content :global(th) {
		background-color: #f9fafb;
		font-weight: 600;
	}
</style>
