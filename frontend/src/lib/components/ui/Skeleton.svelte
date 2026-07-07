<script lang="ts">
	interface Props {
		variant?: 'card' | 'row' | 'list' | 'text';
		count?: number;
		class?: string;
	}

	let { variant = 'card', count = 1, class: className = '' }: Props = $props();
</script>

{#if variant === 'list'}
	<div class="skeleton-list {className}" aria-hidden="true">
		{#each Array(count) as _, i (`${i}`)}
			<div class="skeleton-row-item"></div>
		{/each}
	</div>
{:else if variant === 'row'}
	{#each Array(count) as _, i (`${i}`)}
		<div class="skeleton-row-item {className}" aria-hidden="true"></div>
	{/each}
{:else if variant === 'text'}
	{#each Array(count) as _, i (`${i}`)}
		<div class="skeleton-text {className}" aria-hidden="true"></div>
	{/each}
{:else}
	{#each Array(count) as _, i (`${i}`)}
		<div class="skeleton-card {className}" aria-hidden="true"></div>
	{/each}
{/if}

<style>
	.skeleton-card {
		height: 160px;
		border-radius: 20px;
		background: linear-gradient(
			90deg,
			var(--color-glass-bg) 25%,
			rgba(255, 255, 255, 0.3) 50%,
			var(--color-glass-bg) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		margin-bottom: 1rem;
	}

	.skeleton-row-item {
		height: 60px;
		border-radius: 16px;
		background: linear-gradient(
			90deg,
			var(--color-glass-bg) 25%,
			rgba(255, 255, 255, 0.3) 50%,
			var(--color-glass-bg) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		margin-bottom: 0.75rem;
	}

	.skeleton-text {
		height: 1rem;
		border-radius: 4px;
		background: linear-gradient(
			90deg,
			var(--color-glass-bg) 25%,
			rgba(255, 255, 255, 0.3) 50%,
			var(--color-glass-bg) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		margin-bottom: 0.5rem;
		width: 100%;
	}

	.skeleton-list .skeleton-row-item:last-child {
		width: 60%;
	}
</style>
