<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		icon?: Component<{ size?: number; class?: string }>;
		iconSnippet?: Snippet;
		description?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		title,
		icon,
		iconSnippet,
		description = '',
		class: className = '',
		children
	}: Props = $props();
</script>

<div class="section-card glass {className}">
	<div class="section-card-header">
		{#if iconSnippet}
			{@render iconSnippet()}
		{:else if icon}
			{@const IconComp = icon}
			<IconComp size={20} />
		{/if}
		<h2>{title}</h2>
	</div>
	{#if description}
		<p class="section-card-desc">{description}</p>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.section-card {
		padding: 1.25rem;
		border-radius: 20px;
		transition: var(--transition-smooth);
	}

	.section-card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.section-card-header :global(svg) {
		color: var(--color-primary-green);
		flex-shrink: 0;
	}

	.section-card-header h2 {
		font-family: var(--font-heading);
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.section-card-desc {
		font-size: 0.85rem;
		opacity: 0.55;
		margin: 0 0 0.875rem;
		line-height: 1.5;
	}

	.section-card > :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.75rem;
	}
</style>
