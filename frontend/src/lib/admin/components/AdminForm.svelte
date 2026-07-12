<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onsubmit: (e: SubmitEvent) => void;
		class?: string;
		children?: Snippet;
	}

	let { onsubmit, class: className = '', children }: Props = $props();
</script>

<form onsubmit={onsubmit} class="admin-form {className}" novalidate>
	{#if children}
		{@render children()}
	{/if}
</form>

<style>
	.admin-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}
</style>
