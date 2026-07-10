<script lang="ts">
  import type { AnalyticsRange } from '$lib/admin/api/analytics';

  interface Props {
    range: AnalyticsRange;
    start: string;
    end: string;
    onchange: (next: { range: AnalyticsRange; start: string; end: string }) => void;
    disabled?: boolean;
  }

  let { range, start, end, onchange, disabled = false }: Props = $props();

  const ranges: { value: AnalyticsRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'custom', label: 'Custom' },
  ];

  function select(value: AnalyticsRange) {
    onchange({ range: value, start, end });
  }
</script>

<div class="filter-bar" role="group" aria-label="Analytics date range">
  <div class="range-tabs">
    {#each ranges as r}
      <button
        type="button"
        class="range-tab"
        class:active={range === r.value}
        aria-pressed={range === r.value}
        disabled={disabled}
        onclick={() => select(r.value)}
      >
        {r.label}
      </button>
    {/each}
  </div>

  {#if range === 'custom'}
    <div class="custom-dates">
      <label>
        <span>From</span>
        <input type="date" bind:value={start} disabled={disabled} onchange={() => onchange({ range, start, end })} aria-label="Start date" />
      </label>
      <label>
        <span>To</span>
        <input type="date" bind:value={end} disabled={disabled} onchange={() => onchange({ range, start, end })} aria-label="End date" />
      </label>
    </div>
  {/if}
</div>

<style>
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }
  .range-tabs {
    display: inline-flex;
    background: var(--color-glass-bg);
    border: 1px solid var(--color-glass-border);
    border-radius: 12px;
    padding: 0.25rem;
    gap: 0.25rem;
  }
  .range-tab {
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.45rem 0.9rem;
    border-radius: 9px;
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.15s ease;
  }
  .range-tab:hover:not(:disabled) {
    opacity: 1;
  }
  .range-tab.active {
    background: var(--color-primary-green);
    color: #fff;
    opacity: 1;
  }
  .range-tab:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
  .custom-dates {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .custom-dates label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.55;
    font-weight: 600;
  }
  .custom-dates input {
    padding: 0.45rem 0.6rem;
    border-radius: 9px;
    border: 1px solid var(--color-glass-border);
    background: var(--color-glass-bg);
    color: var(--color-text);
    font-size: 0.85rem;
  }
</style>
