<script lang="ts">
  import {
    Receipt, ArrowRight, AlertTriangle, RefreshCw
  } from '@lucide/svelte';
  import {
    fetchPurchases,
    type PurchasesResponse, type ApiErrorBody,
  } from '$lib/api/account';
  import Pagination from '$lib/components/account/Pagination.svelte';
  import StateCard from '$lib/components/ui/StateCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import { getContext } from 'svelte';
  import type { AuthState } from '$lib/context/auth.svelte';

  const authState = getContext<AuthState>('auth');

  let data = $state<PurchasesResponse | null>(null);
  let loading = $state(true);
  let error = $state('');
  let page = $state(1);
  let limit = 20;

  async function load() {
    loading = true;
    error = '';
    const result = await fetchPurchases(page, limit);
    if ('error' in result) {
      const err = result as ApiErrorBody;
      if (err.status === 401) {
        authState.clearUser();
        return;
      }
      error = err.error?.message || 'Failed to load purchases';
    } else {
      data = result;
    }
    loading = false;
  }

  $effect(() => {
    if (authState.loaded && authState.user) {
      page;
      load();
    }
  });

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function statusLabel(s: string): string {
    if (s === 'paid') return 'Completed';
    if (s === 'refunded') return 'Refunded';
    if (s === 'failed') return 'Failed';
    return 'Pending';
  }
</script>

<div class="page-header">
  <div class="section-card-header">
    <Receipt size={20} aria-hidden="true" />
    <h2>Purchases</h2>
  </div>
  <p class="section-card-desc">View your purchase history and order details.</p>
</div>

{#if loading && !data}
  <Skeleton variant="list" count={3} />
{:else if error}
  <StateCard type="error" icon={AlertTriangle} message={error}>
    <button class="btn btn-primary btn-sm" onclick={load}>
      <RefreshCw size={16} aria-hidden="true" />
      Retry
    </button>
  </StateCard>
{:else if data && data.purchases.length === 0}
  <StateCard type="empty" icon={Receipt} title="No purchases yet" message="Your purchase history will appear here once you make your first purchase.">
    <a href="/solutions" class="btn btn-primary">Browse Products</a>
  </StateCard>
{:else if data}
  <div class="purchases-list" aria-live="polite" aria-label="Purchase history">
    {#if loading}
      <div class="purchases-loading-overlay" aria-hidden="true"></div>
    {/if}
    {#each data.purchases as purchase (purchase.id)}
      <a href="/account/purchases/{purchase.id}" class="purchase-card glass" aria-label="View purchase details for {purchase.product_name}">
        <div class="purchase-info">
          <div class="purchase-product">
            <span class="product-name">{purchase.product_name}</span>
            <StatusBadge status={statusLabel(purchase.status)} />
          </div>
          <div class="purchase-meta">
            <span>{purchase.currency} {(purchase.amount / 100).toFixed(2)}</span>
            <span class="meta-sep">&middot;</span>
            <span>{formatDate(purchase.created_at)}</span>
          </div>
        </div>
        <div class="purchase-action">
          <ArrowRight size={16} aria-hidden="true" />
        </div>
      </a>
    {/each}
  </div>

  <Pagination bind:page totalPages={data.pagination.totalPages} disabled={loading} />
{/if}

<style>
  .purchases-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
  }

  .purchase-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 16px;
    background: var(--color-glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--color-glass-border);
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    width: 100%;
    font-family: inherit;
    text-decoration: none;
    transition: var(--transition-smooth);
  }

  .purchase-card:hover {
    border-color: rgba(123, 144, 75, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(39, 59, 9, 0.06);
  }

  .purchase-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .purchase-product {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .product-name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .purchase-meta {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    opacity: 0.6;
  }

  .meta-sep {
    opacity: 0.4;
  }

  .purchase-action {
    flex-shrink: 0;
    opacity: 0.4;
  }

  .purchase-card:hover .purchase-action {
    opacity: 0.8;
  }

  .purchases-loading-overlay {
    position: absolute;
    inset: 0;
    background: var(--color-glass-bg);
    opacity: 0.4;
    border-radius: 16px;
    pointer-events: none;
    z-index: 1;
  }
</style>
