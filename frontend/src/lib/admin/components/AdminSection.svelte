<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		class?: string;
		children?: Snippet;
	}

	let { title = '', class: className = '', children }: Props = $props();
</script>

<section class="admin-section glass {className}">
	{#if title}
		<h2 class="section-title">{title}</h2>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</section>

<style>
	.admin-section {
		padding: 1.25rem;
		border-radius: 16px;
		margin-bottom: 1rem;
	}

	.section-title {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		color: var(--color-primary-green);
	}
</style>
