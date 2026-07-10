<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminLoading from './AdminLoading.svelte';
	import AdminError from './AdminError.svelte';

	interface Props {
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
		class?: string;
		children?: Snippet;
	}

	let {
		loading = false,
		error = null,
		onRetry,
		class: className = '',
		children
	}: Props = $props();
</script>

<div class="admin-page {className}">
	{#if loading}
		<AdminLoading />
	{:else if error}
		<AdminError message={error} onRetry={onRetry} />
	{:else if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-page {
		width: 100%;
	}
</style>
