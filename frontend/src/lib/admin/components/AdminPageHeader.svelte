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

<div class="admin-page-header {className}">
	<div class="page-header-text">
		<h1 class="page-title">{title}</h1>
		{#if description}
			<p class="page-description">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="page-header-actions">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.admin-page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.page-header-text {
		flex: 1;
		min-width: 0;
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary-green);
		margin: 0;
		line-height: 1.2;
	}

	.page-description {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		opacity: 0.55;
		line-height: 1.5;
	}

	.page-header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.admin-page-header {
			flex-direction: column;
		}

		.page-header-actions {
			width: 100%;
		}

		.page-header-actions :global(.btn) {
			flex: 1;
		}
	}
</style>
