<script lang="ts">
  import { getContext } from 'svelte';
  import {
    CreditCard, AlertTriangle, RefreshCw, Copy
  } from '@lucide/svelte';
  import {
    fetchBilling,
    type BillingResponse, type ApiErrorBody,
  } from '$lib/api/account';
  import Pagination from '$lib/components/account/Pagination.svelte';
  import type { AuthState } from '$lib/context/auth.svelte';
  import type { ToastState } from '$lib/context/toast.svelte';

  const authState = getContext<AuthState>('auth');
  const toast = getContext<ToastState>('toast');

  let data = $state<BillingResponse | null>(null);
  let loading = $state(true);
  let error = $state('');
  let page = $state(1);
  let limit = 20;

  async function load() {
    loading = true;
    error = '';
    const result = await fetchBilling(page, limit);
    if ('error' in result) {
      const err = result as ApiErrorBody;
      if (err.status === 401) {
        authState.clearUser();
        return;
      }
      error = err.error?.message || 'Failed to load billing history';
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

  function formatAmount(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount / 100);
    } catch {
      return `${currency} ${(amount / 100).toFixed(2)}`;
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Completed';
      case 'refunded': return 'Refunded';
      default: return 'Failed';
    }
  }

  function statusClass(status: string): string {
    if (status === 'paid') return 'status-paid';
    if (status === 'refunded') return 'status-refunded';
    return 'status-failed';
  }

  async function copyToClipboard(val: string) {
    try {
      await navigator.clipboard.writeText(val);
      toast.addToast('Copied to clipboard', 'success');
    } catch {
      toast.addToast('Failed to copy', 'error');
    }
  }
</script>

<div class="page-header">
  <div class="section-card-header">
    <CreditCard size={20} />
    <h2>Billing History</h2>
  </div>
  <p class="section-card-desc">View your payment history and transaction details.</p>
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
{:else if data && data.payments.length === 0}
  <div class="state-card empty">
    <CreditCard size={32} />
    <h3>No billing history</h3>
    <p>Your payment history will appear here after your first purchase.</p>
  </div>
{:else if data}
  <div class="billing-table glass" aria-live="polite">
    <div class="table-header">
      <span class="col-product">Product</span>
      <span class="col-amount">Amount</span>
      <span class="col-status">Status</span>
      <span class="col-date">Date</span>
      <span class="col-ids">Order / Payment ID</span>
    </div>
    <div class="table-body">
      {#each data.payments as payment (payment.id)}
        <div class="table-row">
          <div class="col-product">
            <span class="row-product">{payment.product_name}</span>
          </div>
          <div class="col-amount">
            <span class="row-amount">{formatAmount(payment.amount, payment.currency)}</span>
          </div>
          <div class="col-status">
            <span class="payment-status {statusClass(payment.status)}">{statusLabel(payment.status)}</span>
          </div>
          <div class="col-date">
            <span class="row-date">{formatDate(payment.created_at)}</span>
          </div>
          <div class="col-ids">
            <div class="id-list">
              {#if payment.razorpay_order_id}
                <button class="id-chip" onclick={() => copyToClipboard(payment.razorpay_order_id)} title="Copy Order ID" aria-label="Copy order ID {payment.razorpay_order_id}">
                  <Copy size={10} aria-hidden="true" />
                  {payment.razorpay_order_id.slice(0, 16)}...
                </button>
              {/if}
              {#if payment.razorpay_payment_id}
                <button class="id-chip" onclick={() => copyToClipboard(payment.razorpay_payment_id!)} title="Copy Payment ID" aria-label="Copy payment ID {payment.razorpay_payment_id}">
                  <Copy size={10} aria-hidden="true" />
                  {payment.razorpay_payment_id.slice(0, 16)}...
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if loading && data}
    <div class="billing-loading-overlay">Loading...</div>
  {/if}

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

  .billing-table {
    border-radius: 20px;
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr 100px 90px 1fr 1fr;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.5;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--color-glass-border);
  }

  .table-body {
    display: flex;
    flex-direction: column;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr 100px 90px 1fr 1fr;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    align-items: center;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--color-glass-border);
    transition: background 0.15s;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background: var(--color-glass-bg);
  }

  .row-product {
    font-weight: 500;
  }

  .row-amount {
    font-weight: 600;
    font-family: var(--font-heading);
  }

  .payment-status {
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

  .row-date {
    opacity: 0.6;
    font-size: 0.8rem;
  }

  .id-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .id-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    opacity: 0.6;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.125rem 0;
    transition: opacity 0.2s;
  }

  .id-chip:hover {
    opacity: 1;
  }

  .billing-loading-overlay {
    text-align: center;
    padding: 0.75rem;
    font-size: 0.85rem;
    opacity: 0.5;
  }

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

  @media (prefers-reduced-motion: reduce) {
    .skeleton-row-item {
      animation: none;
    }
  }

  @media (max-width: 768px) {
    .table-header {
      display: none;
    }

    .table-row {
      grid-template-columns: 1fr 1fr;
      gap: 0.375rem;
    }

    .col-product { grid-column: 1 / -1; }
    .col-ids { grid-column: 1 / -1; }
  }
</style>
