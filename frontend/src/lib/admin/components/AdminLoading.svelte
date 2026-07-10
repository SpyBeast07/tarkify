<script lang="ts">
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	interface Props {
		variant?: 'page' | 'table' | 'card';
		count?: number;
		class?: string;
	}

	let { variant = 'page', count = 3, class: className = '' }: Props = $props();
</script>

<div class="admin-loading {className}" aria-busy="true" aria-label="Loading">
	{#if variant === 'page'}
		<div class="loading-header">
			<div class="loading-title-shimmer"></div>
			<div class="loading-desc-shimmer"></div>
		</div>
		<Skeleton variant="card" count={count} />
	{:else if variant === 'table'}
		<div class="loading-table">
			<div class="loading-table-header"></div>
			<Skeleton variant="list" count={count} />
		</div>
	{:else if variant === 'card'}
		<Skeleton variant="card" count={count} />
	{/if}
</div>

<style>
	.admin-loading {
		width: 100%;
	}

	.loading-header {
		margin-bottom: 1.5rem;
	}

	.loading-title-shimmer {
		width: 40%;
		height: 1.5rem;
		border-radius: 8px;
		background: linear-gradient(
			90deg,
			var(--color-glass-bg) 25%,
			rgba(255, 255, 255, 0.3) 50%,
			var(--color-glass-bg) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		margin-bottom: 0.5rem;
	}

	.loading-desc-shimmer {
		width: 60%;
		height: 0.875rem;
		border-radius: 4px;
		background: linear-gradient(
			90deg,
			var(--color-glass-bg) 25%,
			rgba(255, 255, 255, 0.3) 50%,
			var(--color-glass-bg) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.loading-table {
		border-radius: 16px;
		overflow: hidden;
	}

	.loading-table-header {
		height: 44px;
		background: linear-gradient(
			90deg,
			var(--color-glass-bg) 25%,
			rgba(255, 255, 255, 0.3) 50%,
			var(--color-glass-bg) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 16px 16px 0 0;
		margin-bottom: 0.5rem;
	}
</style>
