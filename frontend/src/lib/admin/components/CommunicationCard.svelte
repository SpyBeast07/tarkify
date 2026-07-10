<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		icon?: Component<{ size?: number; class?: string }>;
		href?: string;
		description?: string;
		children?: import('svelte').Snippet;
	}

	let { title, icon, href, description = '', children }: Props = $props();
</script>

<div class="comm-card glass">
	<div class="comm-card-header">
		{#if icon}
			{@const IconComp = icon}
			<IconComp size={20} />
		{/if}
		<h3>{title}</h3>
		{#if href}
			<a {href} class="card-link">View all</a>
		{/if}
	</div>
	{#if description}
		<p class="comm-card-desc">{description}</p>
	{/if}
	{#if children}
		<div class="comm-card-body">{@render children()}</div>
	{/if}
</div>

<style>
	.comm-card {
		padding: 1.25rem;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.comm-card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.comm-card-header :global(svg) {
		color: var(--color-primary-green);
		flex-shrink: 0;
	}

	.comm-card-header h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		flex: 1;
	}

	.card-link {
		font-size: 0.8rem;
		color: var(--color-accent-green);
		text-decoration: none;
	}

	.card-link:hover {
		text-decoration: underline;
	}

	.comm-card-desc {
		font-size: 0.85rem;
		opacity: 0.55;
		margin: 0;
	}

	.comm-card-body {
		margin-top: 0.5rem;
	}
</style>
