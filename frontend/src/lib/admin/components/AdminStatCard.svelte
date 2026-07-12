<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		label: string;
		value: string | number;
		icon?: Component<{ size?: number; class?: string }>;
		subtext?: string;
		class?: string;
	}

	let { label, value, icon: IconComp, subtext = '', class: className = '' }: Props = $props();
</script>

<div class="admin-stat-card glass {className}">
	<div class="stat-card-main">
		<div class="stat-card-text">
			<span class="stat-card-label">{label}</span>
			<span class="stat-card-value">{value}</span>
		</div>
		{#if IconComp}
			<span class="stat-card-icon" aria-hidden="true"><IconComp size={24} /></span>
		{/if}
	</div>
	{#if subtext}
		<div class="stat-card-subtext">{subtext}</div>
	{/if}
</div>

<style>
	.admin-stat-card {
		padding: 1.25rem;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		width: 100%;
	}

	.stat-card-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.stat-card-text {
		display: flex;
		flex-direction: column;
	}

	.stat-card-label {
		font-size: 0.8rem;
		font-weight: 500;
		opacity: 0.55;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.stat-card-value {
		font-family: var(--font-heading);
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--color-text);
		margin-top: 0.125rem;
	}

	.stat-card-icon {
		color: var(--color-accent-green);
		opacity: 0.8;
		background: rgba(123, 144, 75, 0.08);
		padding: 0.5rem;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-card-subtext {
		font-size: 0.78rem;
		opacity: 0.6;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
</style>
