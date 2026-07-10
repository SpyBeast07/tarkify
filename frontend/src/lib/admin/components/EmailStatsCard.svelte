<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		label: string;
		value: string | number;
		icon?: Component<{ size?: number; class?: string }>;
		variant?: 'default' | 'success' | 'danger' | 'warning';
	}

	let { label, value, icon, variant = 'default' }: Props = $props();
</script>

<div class="stat-card glass variant-{variant}">
	{#if icon}
		{@const IconComp = icon}
		<div class="stat-icon"><IconComp size={20} /></div>
	{/if}
	<div class="stat-body">
		<span class="stat-value">{value}</span>
		<span class="stat-label">{label}</span>
	</div>
</div>

<style>
	.stat-card {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 1.1rem 1.25rem;
		border-radius: 16px;
	}
	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		border-radius: 12px;
		background: var(--color-glass-bg);
		color: var(--color-primary-green);
		flex-shrink: 0;
	}
	.variant-success .stat-icon { color: #5a7a1a; }
	.variant-danger .stat-icon { color: #ef4444; }
	.variant-warning .stat-icon { color: #d97706; }
	.stat-body {
		display: flex;
		flex-direction: column;
	}
	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		font-family: var(--font-heading);
		line-height: 1.1;
	}
	.stat-label {
		font-size: 0.8rem;
		opacity: 0.55;
	}
</style>
