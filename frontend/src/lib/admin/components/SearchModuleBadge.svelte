<script lang="ts">
  import type { SearchModule } from '$lib/admin/types/search';

  interface Props {
    module: SearchModule;
  }

  let { module }: Props = $props();

  const COLORS: Record<SearchModule, string> = {
    products: '#7b904b',
    orders: '#6366f1',
    customers: '#0ea5e9',
    emails: '#8b5cf6',
    contact: '#f59e0b',
    feedback: '#ec4899',
    newsletter: '#14b8a6',
    careers: '#ef4444',
    audit: '#64748b'
  };

  const color = $derived(COLORS[module] ?? '#64748b');
  const label = $derived(module.charAt(0).toUpperCase() + module.slice(1));
</script>

<span class="search-module-badge" style="--badge-color: {color}" role="status">{label}</span>

<style>
  .search-module-badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
    background: color-mix(in srgb, var(--badge-color) 14%, transparent);
    color: var(--badge-color);
    border: 1px solid color-mix(in srgb, var(--badge-color) 30%, transparent);
  }
</style>
