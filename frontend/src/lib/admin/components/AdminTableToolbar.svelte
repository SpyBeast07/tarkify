<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="admin-table-toolbar {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-table-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 1rem;
		border-bottom: 1px solid var(--color-glass-border);
		flex-wrap: wrap;
		width: 100%;
	}

	@media (max-width: 640px) {
		.admin-table-toolbar {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
