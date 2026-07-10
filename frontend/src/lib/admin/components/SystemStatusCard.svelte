<script lang="ts">
  import type { Component } from 'svelte';
  import type { HealthStatus } from '$lib/admin/types/system';
  import HealthBadge from './HealthBadge.svelte';

  export interface MetricRow {
    label: string;
    value: string;
  }

  interface Props {
    title: string;
    status: HealthStatus;
    metrics?: MetricRow[];
    icon?: Component<{ size?: number; class?: string }>;
    note?: string;
  }

  let { title, status, metrics = [], icon, note }: Props = $props();
</script>

<div class="system-card glass status-{status}">
  <div class="sc-head">
    <div class="sc-title">
      {#if icon}
        {@const Icon = icon}
        <span class="sc-icon"><Icon size={18} /></span>
      {/if}
      <h3>{title}</h3>
    </div>
    <HealthBadge {status} />
  </div>

  {#if metrics.length > 0}
    <dl class="sc-metrics">
      {#each metrics as m (m.label)}
        <div class="sc-row">
          <dt>{m.label}</dt>
          <dd>{m.value}</dd>
        </div>
      {/each}
    </dl>
  {/if}

  {#if note}
    <p class="sc-note">{note}</p>
  {/if}
</div>

<style>
  .system-card {
    padding: 1.1rem 1.25rem;
    border-radius: 16px;
    border-left: 3px solid transparent;
  }
  .status-healthy { border-left-color: #5a7a1a; }
  .status-warning { border-left-color: #d97706; }
  .status-error { border-left-color: #ef4444; }
  .status-unknown { border-left-color: #64748b; }

  .sc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.85rem;
  }
  .sc-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sc-title h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  .sc-icon {
    display: flex;
    color: var(--color-primary-green);
  }
  .sc-metrics {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .sc-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.85rem;
  }
  .sc-row dt {
    opacity: 0.55;
    margin: 0;
  }
  .sc-row dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
    word-break: break-word;
  }
  .sc-note {
    margin: 0.75rem 0 0;
    font-size: 0.78rem;
    opacity: 0.6;
  }
</style>
