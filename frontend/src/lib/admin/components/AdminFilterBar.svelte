<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="admin-filter-bar {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: flex-end;
		margin-bottom: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		width: 100%;
	}

	@media (max-width: 768px) {
		.admin-filter-bar {
			flex-direction: column;
			align-items: stretch;
			padding: 0.75rem;
		}

		.admin-filter-bar :global(.admin-input-group),
		.admin-filter-bar :global(.admin-select-group) {
			width: 100% !important;
		}
	}
</style>
