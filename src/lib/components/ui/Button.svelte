<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		class: className = '',
		type = 'button',
		onclick,
		children
	}: Props = $props();

	const variants = {
		primary: [
			'bg-gradient-to-r from-accent-500 to-orange-600',
			'text-white font-semibold',
			'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
			'hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]',
			'hover:from-accent-400 hover:to-orange-500',
			'hover:-translate-y-0.5',
			'active:translate-y-0',
			'focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
		].join(' '),
		secondary: [
			'bg-surface border border-border',
			'text-foreground',
			'hover:bg-surface-hover hover:border-border-subtle',
			'focus-visible:ring-2 focus-visible:ring-accent-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
		].join(' '),
		accent: [
			'bg-accent-600 text-white',
			'hover:bg-accent-500',
			'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
			'hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]',
			'focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
		].join(' '),
		ghost: [
			'bg-transparent text-foreground-muted',
			'hover:bg-surface hover:text-foreground',
			'focus-visible:ring-2 focus-visible:ring-accent-500/30'
		].join(' '),
		outline: [
			'bg-transparent text-accent-500 border border-accent-500',
			'hover:bg-accent-500/10',
			'focus-visible:ring-2 focus-visible:ring-accent-500/30'
		].join(' ')
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
		md: 'px-4 py-2.5 text-base rounded-xl gap-2',
		lg: 'px-6 py-3.5 text-lg rounded-xl gap-2.5'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	class={cn(
		'inline-flex items-center justify-center font-medium',
		'transition-all duration-300 ease-out',
		'disabled:cursor-not-allowed disabled:opacity-50',
		'relative overflow-hidden',
		variants[variant],
		sizes[size],
		className
	)}
>
	{#if loading}
		<svg
			class="h-5 w-5 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle
				class="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{@render children()}
</button>
