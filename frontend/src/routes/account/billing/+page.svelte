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
  import StateCard from '$lib/components/ui/StateCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
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
  <Skeleton variant="list" count={3} />
{:else if error}
  <StateCard type="error" icon={AlertTriangle} message={error}>
    <button class="btn btn-primary btn-sm" onclick={load}>
      <RefreshCw size={16} />
      Retry
    </button>
  </StateCard>
{:else if data && data.payments.length === 0}
  <StateCard type="empty" icon={CreditCard} title="No billing history" message="Your payment history will appear here after your first purchase." />
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
            <StatusBadge status={statusLabel(payment.status)} />
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
  .billing-table {
    border-radius: 20px;
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr 100px 90px 1fr 1fr;
    gap: 0.375rem;
    padding: 0.625rem 1rem;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.45;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--color-glass-border);
  }

  .table-body {
    display: flex;
    flex-direction: column;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr 100px 90px 1fr 1fr;
    gap: 0.375rem;
    padding: 0.75rem 1rem;
    align-items: center;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--color-glass-border);
    transition: var(--transition-smooth);
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background: var(--color-glass-bg);
    border-color: rgba(123, 144, 75, 0.1);
  }

  .row-product {
    font-weight: 500;
  }

  .row-amount {
    font-weight: 600;
    font-family: var(--font-heading);
  }

  .row-date {
    opacity: 0.55;
    font-size: 0.75rem;
  }

  .id-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .id-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    opacity: 0.55;
    background: var(--color-glass-bg);
    border: 1px solid var(--color-glass-border);
    border-radius: 6px;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    transition: var(--transition-smooth);
  }

  .id-chip:hover {
    opacity: 1;
    border-color: rgba(123, 144, 75, 0.3);
  }

  .billing-loading-overlay {
    text-align: center;
    padding: 0.75rem;
    font-size: 0.85rem;
    opacity: 0.5;
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
