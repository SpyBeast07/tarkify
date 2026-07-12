<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		label: string;
		value: string | number;
		icon?: Component<{ size?: number; class?: string }>;
		trend?: number | null; // e.g. 12.5 (positive) or -3.2 (negative)
		subtext?: string;
		href?: string;
		class?: string;
	}

	let { label, value, icon: IconComp, trend, subtext = '', href, class: className = '' }: Props = $props();
</script>

{#if href}
	<a href={href} class="admin-metric-card glass clickable {className}">
		<div class="metric-card-content">
			<div class="metric-header">
				<span class="metric-label">{label}</span>
				{#if IconComp}
					<span class="metric-icon" aria-hidden="true"><IconComp size={18} /></span>
				{/if}
			</div>
			<div class="metric-value">{value}</div>
			<div class="metric-footer">
				{#if trend != null}
					<span class="trend-badge" class:up={trend > 0} class:down={trend < 0}>
						{trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
					</span>
				{/if}
				{#if subtext}
					<span class="metric-subtext">{subtext}</span>
				{/if}
			</div>
		</div>
	</a>
{:else}
	<div class="admin-metric-card glass {className}">
		<div class="metric-card-content">
			<div class="metric-header">
				<span class="metric-label">{label}</span>
				{#if IconComp}
					<span class="metric-icon" aria-hidden="true"><IconComp size={18} /></span>
				{/if}
			</div>
			<div class="metric-value">{value}</div>
			<div class="metric-footer">
				{#if trend != null}
					<span class="trend-badge" class:up={trend > 0} class:down={trend < 0}>
						{trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
					</span>
				{/if}
				{#if subtext}
					<span class="metric-subtext">{subtext}</span>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-metric-card {
		padding: 1.5rem;
		border-radius: 18px;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		display: flex;
		flex-direction: column;
		width: 100%;
		transition: var(--transition-smooth);
	}

	.admin-metric-card.clickable:hover {
		border-color: var(--color-accent-green);
		background: rgba(123, 144, 75, 0.05);
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(39, 59, 9, 0.05);
	}

	.metric-card-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.metric-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.metric-label {
		font-size: 0.85rem;
		font-weight: 500;
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.metric-icon {
		color: var(--color-accent-green);
		opacity: 0.8;
	}

	.metric-value {
		font-family: var(--font-heading);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-primary-green);
	}

	.metric-footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.trend-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: 6px;
	}

	.trend-badge.up {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.trend-badge.down {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
	}

	.metric-subtext {
		font-size: 0.8rem;
		opacity: 0.55;
	}
</style>
