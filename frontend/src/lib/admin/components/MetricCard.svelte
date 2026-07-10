<script lang="ts">
  import type { HealthStatus } from '$lib/admin/types/system';
  import HealthBadge from './HealthBadge.svelte';

  interface Props {
    label: string;
    value: string;
    status?: HealthStatus;
    hint?: string;
  }

  let { label, value, status, hint }: Props = $props();
</script>

<div class="metric-card glass">
  <span class="mc-label">{label}</span>
  <span class="mc-value">{value}</span>
  {#if status}
    <HealthBadge {status} />
  {/if}
  {#if hint}
    <span class="mc-hint">{hint}</span>
  {/if}
</div>

<style>
  .metric-card {
    padding: 1rem 1.25rem;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .mc-label {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.55;
    font-weight: 600;
  }
  .mc-value {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-heading);
    line-height: 1.1;
  }
  .mc-hint {
    font-size: 0.75rem;
    opacity: 0.5;
  }
</style>
