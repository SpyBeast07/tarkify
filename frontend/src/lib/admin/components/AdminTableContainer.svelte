<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="admin-table-container glass {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-table-container {
		border-radius: 16px;
		overflow: hidden;
		width: 100%;
	}

	.admin-table-container :global(table) {
		width: 100%;
		border-collapse: collapse;
	}

	.admin-table-container :global(th) {
		text-align: left;
		padding: 0.75rem 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.6;
		border-bottom: 1px solid var(--color-glass-border);
		white-space: nowrap;
	}

	.admin-table-container :global(td) {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--color-glass-border);
	}

	.admin-table-container :global(tr:last-child td) {
		border-bottom: none;
	}

	.admin-table-container :global(tbody tr:hover) {
		background: rgba(123, 144, 75, 0.04);
	}
</style>
