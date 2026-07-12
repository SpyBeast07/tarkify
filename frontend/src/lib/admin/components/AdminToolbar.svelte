<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="admin-toolbar {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
		width: 100%;
	}

	@media (max-width: 768px) {
		.admin-toolbar {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
