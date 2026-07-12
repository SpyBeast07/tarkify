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
	{:else}
		{#if error}
			<div class="admin-page-error-bar">
				<AdminError message={error} onRetry={onRetry} />
			</div>
		{/if}
		{#if children}
			{@render children()}
		{/if}
	{/if}
</div>

<style>
	.admin-page {
		width: 100%;
	}

	.admin-page-error-bar {
		margin-bottom: 1rem;
	}

	.admin-page-error-bar :global(.admin-error) {
		padding: 0.75rem 1rem;
		border-radius: 12px;
	}

	.admin-page-error-bar :global(.admin-error-action) {
		margin-top: 0.5rem;
	}
</style>
