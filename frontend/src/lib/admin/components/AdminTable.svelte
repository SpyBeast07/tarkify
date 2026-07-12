<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="admin-table-scroll-wrapper glass {className}">
	<table class="admin-table">
		{#if children}
			{@render children()}
		{/if}
	</table>
</div>

<style>
	.admin-table-scroll-wrapper {
		width: 100%;
		overflow-x: auto;
		border-radius: 16px;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		backdrop-filter: var(--glass-blur);
		-webkit-overflow-scrolling: touch;
	}

	.admin-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.admin-table :global(th) {
		padding: 0.75rem 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.6;
		border-bottom: 1px solid var(--color-glass-border);
		white-space: nowrap;
		background: rgba(255, 255, 255, 0.1);
	}

	[data-theme='dark'] .admin-table :global(th) {
		background: rgba(0, 0, 0, 0.2);
	}

	.admin-table :global(td) {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--color-glass-border);
		vertical-align: middle;
	}

	.admin-table :global(tr:last-child td) {
		border-bottom: none;
	}

	.admin-table :global(tbody tr) {
		transition: background 0.2s ease;
	}

	.admin-table :global(tbody tr:hover) {
		background: rgba(123, 144, 75, 0.04);
	}
</style>
