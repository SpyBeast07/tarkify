<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="admin-page-container {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-page-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.admin-page-container {
			gap: 1rem;
		}
	}
</style>
