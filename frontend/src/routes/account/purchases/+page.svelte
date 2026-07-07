<script lang="ts">
  import {
    Receipt, ArrowRight, AlertTriangle, RefreshCw
  } from '@lucide/svelte';
  import {
    fetchPurchases,
    type PurchasesResponse, type ApiErrorBody,
  } from '$lib/api/account';
  import Pagination from '$lib/components/account/Pagination.svelte';
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

  function statusClass(status: string): string {
    if (status === 'paid') return 'status-paid';
    if (status === 'refunded') return 'status-refunded';
    if (status === 'failed') return 'status-failed';
    return 'status-created';
  }
</script>

<div class="page-header">
  <div class="section-card-header">
    <Receipt size={20} />
    <h2>Purchases</h2>
  </div>
  <p class="section-card-desc">View your purchase history and order details.</p>
</div>

{#if loading && !data}
  <div class="skeleton-list" aria-hidden="true">
    {#each { length: 3 } as _}
      <div class="skeleton-row-item"></div>
    {/each}
  </div>
{:else if error}
  <div class="state-card error" role="alert">
    <AlertTriangle size={24} />
    <p>{error}</p>
    <button class="btn btn-primary btn-sm" onclick={load}>
      <RefreshCw size={16} />
      Retry
    </button>
  </div>
{:else if data && data.purchases.length === 0}
  <div class="state-card empty">
    <Receipt size={32} />
    <h3>No purchases yet</h3>
    <p>Your purchase history will appear here once you make your first purchase.</p>
    <a href="/solutions" class="btn btn-primary">Browse Products</a>
  </div>
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
            <span class="purchase-status {statusClass(purchase.status)}">{statusLabel(purchase.status)}</span>
          </div>
          <div class="purchase-meta">
            <span>{purchase.currency} {(purchase.amount / 100).toFixed(2)}</span>
            <span class="meta-sep">&middot;</span>
            <span>{formatDate(purchase.created_at)}</span>
          </div>
        </div>
        <div class="purchase-action">
          <ArrowRight size={16} />
        </div>
      </a>
    {/each}
  </div>

  <Pagination bind:page totalPages={data.pagination.totalPages} disabled={loading} />
{/if}

<style>
  .page-header {
    margin-bottom: 1rem;
  }

  .section-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    color: var(--color-primary-green);
  }

  .section-card-header h2 {
    font-family: var(--font-heading);
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }

  .section-card-desc {
    font-size: 0.85rem;
    opacity: 0.6;
    margin: 0;
  }

  .purchases-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .purchase-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 16px;
    border: none;
    background: var(--color-glass-bg);
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    width: 100%;
    font-family: inherit;
    text-decoration: none;
    transition: background 0.2s;
  }

  .purchase-card:hover {
    background: var(--color-card-bg);
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

  .purchase-status {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .status-paid {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .status-refunded {
    background: rgba(251, 191, 36, 0.15);
    color: #f59e0b;
  }

  .status-failed {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .status-created {
    background: rgba(99, 102, 241, 0.15);
    color: #6366f1;
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

  /* ── States ── */
  .state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2.5rem 2rem;
    border-radius: 20px;
    text-align: center;
  }

  .state-card.error {
    color: #ef4444;
  }

  .state-card.empty {
    opacity: 0.7;
  }

  .state-card h3 {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  .state-card p {
    font-size: 0.9rem;
    margin: 0;
    max-width: 360px;
  }

  .error .btn {
    margin-top: 0.5rem;
  }

  .skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton-row-item {
    height: 60px;
    border-radius: 16px;
    background: var(--color-glass-bg);
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { opacity: 0.5; }
    50% { opacity: 0.8; }
    100% { opacity: 0.5; }
  }

  .purchases-list {
    position: relative;
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

  @media (prefers-reduced-motion: reduce) {
    .skeleton-list * {
      animation: none;
    }
  }
</style>
