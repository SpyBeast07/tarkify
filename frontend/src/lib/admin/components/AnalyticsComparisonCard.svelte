<script lang="ts">
  import { ArrowUpRight, ArrowDownRight, Minus } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import type { GrowthMetric } from '$lib/admin/types/analytics';

  interface Props {
    label: string;
    metric: GrowthMetric;
    icon?: Component<{ size?: number; class?: string }>;
    valueFormatter?: (n: number) => string;
  }

  let {
    label,
    metric,
    icon,
    valueFormatter = (n: number) => String(n),
  }: Props = $props();

  const direction = $derived(metric.deltaPct > 0 ? 'up' : metric.deltaPct < 0 ? 'down' : 'flat');
</script>

<div class="comparison-card glass">
  <div class="cc-top">
    {#if icon}
      {@const Icon = icon}
      <div class="cc-icon"><Icon size={18} /></div>
    {/if}
    <span class="cc-label">{label}</span>
  </div>
  <div class="cc-current">{valueFormatter(metric.current)}</div>
  <div class="cc-prev">vs {valueFormatter(metric.previous)} prev period</div>
  <div class="cc-delta" class:up={direction === 'up'} class:down={direction === 'down'} class:flat={direction === 'flat'}>
    {#if direction === 'up'}
      <ArrowUpRight size={16} />
    {:else if direction === 'down'}
      <ArrowDownRight size={16} />
    {:else}
      <Minus size={16} />
    {/if}
    {metric.deltaPct > 0 ? '+' : ''}{metric.deltaPct}%
  </div>
</div>

<style>
  .comparison-card {
    padding: 1.1rem 1.25rem;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .cc-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .cc-icon {
    display: flex;
    color: var(--color-primary-green);
  }
  .cc-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.55;
    font-weight: 600;
  }
  .cc-current {
    font-size: 1.6rem;
    font-weight: 700;
    font-family: var(--font-heading);
    line-height: 1.1;
  }
  .cc-prev {
    font-size: 0.78rem;
    opacity: 0.5;
  }
  .cc-delta {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.85rem;
    font-weight: 700;
    margin-top: 0.15rem;
  }
  .cc-delta.up { color: #5a7a1a; }
  .cc-delta.down { color: #ef4444; }
  .cc-delta.flat { color: #64748b; }
</style>
