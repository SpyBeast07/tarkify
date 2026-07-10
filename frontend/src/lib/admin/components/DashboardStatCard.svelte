<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		label: string;
		value: string | number;
		icon: Component<{ size?: number; class?: string }>;
		subtext?: string;
		href?: string;
	}

	let { label, value, icon: IconComp, subtext = '', href }: Props = $props();
</script>

{#if href}
	<a href={href} class="stat-card glass">
		<div class="stat-icon" aria-hidden="true">
			<IconComp size={22} />
		</div>
		<div class="stat-body">
			<span class="stat-value">{value}</span>
			<span class="stat-label">{label}</span>
			{#if subtext}
				<span class="stat-subtext">{subtext}</span>
			{/if}
		</div>
	</a>
{:else}
	<div class="stat-card glass">
		<div class="stat-icon" aria-hidden="true">
			<IconComp size={22} />
		</div>
		<div class="stat-body">
			<span class="stat-value">{value}</span>
			<span class="stat-label">{label}</span>
			{#if subtext}
				<span class="stat-subtext">{subtext}</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.stat-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: 14px;
		text-decoration: none;
		color: inherit;
		transition: all 0.15s ease;
	}

	a.stat-card:hover {
		background: rgba(123, 144, 75, 0.08);
		transform: translateY(-1px);
	}

	.stat-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: rgba(123, 144, 75, 0.1);
		color: var(--color-accent-green);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stat-body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.stat-value {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--color-primary-green);
	}

	.stat-label {
		font-size: 0.8rem;
		opacity: 0.55;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stat-subtext {
		font-size: 0.75rem;
		opacity: 0.4;
	}
</style>
