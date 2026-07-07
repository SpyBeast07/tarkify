<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Component } from 'svelte';

	interface Props {
		type: 'empty' | 'error';
		icon: Component<{ size?: number; class?: string }>;
		title?: string;
		message?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		type,
		icon: IconComp,
		title = '',
		message = '',
		class: className = '',
		children
	}: Props = $props();
</script>

<div class="state-card {type} {className}" role={type === 'error' ? 'alert' : undefined}>
	<span aria-hidden="true"><IconComp size={32} /></span>
	{#if title}
		<h3>{title}</h3>
	{/if}
	{#if message}
		<p>{message}</p>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.state-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2.5rem 2rem;
		border-radius: 20px;
		text-align: center;
	}

	.state-card.error {
		color: #ef4444;
	}

	.state-card.empty {
		opacity: 0.7;
	}

	.state-card h3 {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.state-card p {
		font-size: 0.9rem;
		margin: 0;
		max-width: 360px;
		opacity: 0.8;
	}

	.state-card.error p {
		opacity: 1;
	}

	.state-card :global(.btn) {
		margin-top: 0.5rem;
	}
</style>
