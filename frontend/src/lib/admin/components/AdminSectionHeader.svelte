<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		class?: string;
		children?: Snippet;
	}

	let { title, description = '', class: className = '', children }: Props = $props();
</script>

<div class="admin-section-header {className}">
	<div class="section-header-text">
		<h2 class="section-header-title">{title}</h2>
		{#if description}
			<p class="section-header-desc">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="section-header-actions">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.admin-section-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		width: 100%;
	}

	.section-header-text {
		flex: 1;
		min-width: 0;
	}

	.section-header-title {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--color-primary-green);
		margin: 0;
	}

	.section-header-desc {
		font-size: 0.85rem;
		opacity: 0.55;
		margin: 0.15rem 0 0;
		line-height: 1.4;
	}

	.section-header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
