<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="admin-table-actions {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-table-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}
</style>
