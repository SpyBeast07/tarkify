<script lang="ts">
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    Receipt, ArrowLeft, AlertTriangle, RefreshCw, Copy, Download
  } from '@lucide/svelte';
  import {
    fetchPurchase,
    type PurchaseRow, type ApiErrorBody,
  } from '$lib/api/account';
  import type { AuthState } from '$lib/context/auth.svelte';
  import type { ToastState } from '$lib/context/toast.svelte';

  const authState = getContext<AuthState>('auth');
  const toast = getContext<ToastState>('toast');

  let purchase = $state<PurchaseRow | null>(null);
  let loading = $state(true);
  let error = $state('');

  const purchaseId = $derived($page.params.id ?? '');

  async function load() {
    if (!purchaseId) {
      error = 'Purchase not found.';
      loading = false;
      return;
    }
    loading = true;
    error = '';
    const result = await fetchPurchase(purchaseId);
    if ('error' in result) {
      const errBody = result as ApiErrorBody;
      if (errBody.status === 404) {
        error = 'Purchase not found.';
      } else {
        error = errBody.error?.message || 'Failed to load purchase';
      }
    } else {
      purchase = result.purchase;
    }
    loading = false;
  }

  $effect(() => {
    if (authState.loaded && authState.user && purchaseId) {
      load();
    }
  });

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function statusLabel(status: string): string {
    if (status === 'paid') return 'Completed';
    if (status === 'refunded') return 'Refunded';
    if (status === 'failed') return 'Failed';
    return 'Pending';
  }

  function statusClass(status: string): string {
    if (status === 'paid') return 'status-paid';
    if (status === 'refunded') return 'status-refunded';
    if (status === 'failed') return 'status-failed';
    return 'status-created';
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

<div class="detail-page">
  <button class="back-btn" onclick={() => goto('/account/purchases')}>
    <ArrowLeft size={16} />
    Back to Purchases
  </button>

  {#if loading}
    <div class="skeleton-card tall"></div>
  {:else if error}
    <div class="state-card error">
      <AlertTriangle size={24} />
      <p>{error}</p>
      <button class="btn btn-primary btn-sm" onclick={load}>
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  {:else if purchase}
    {@const p = purchase}
    <div class="section-card glass">
      <div class="section-card-header">
        <Receipt size={20} />
        <h2>Purchase Details</h2>
      </div>

      <div class="detail-grid">
        <div class="detail-field">
          <span class="detail-label">Product</span>
          <span class="detail-value">{p.product_name}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Status</span>
          <span class="purchase-status {statusClass(p.status)}">{statusLabel(p.status)}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Amount</span>
          <span class="detail-value">{p.currency} {(p.amount / 100).toFixed(2)}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Payment Provider</span>
          <span class="detail-value">{p.payment_provider}</span>
        </div>
        {#if p.razorpay_order_id}
          <div class="detail-field">
            <span class="detail-label">Order ID</span>
            <span class="detail-value mono">
              {p.razorpay_order_id}
              <button class="copy-btn" onclick={() => copyToClipboard(p.razorpay_order_id)}>
                <Copy size={14} />
              </button>
            </span>
          </div>
        {/if}
        {#if p.razorpay_payment_id}
          <div class="detail-field">
            <span class="detail-label">Payment ID</span>
            <span class="detail-value mono">
              {p.razorpay_payment_id}
              <button class="copy-btn" onclick={() => { if (p.razorpay_payment_id) copyToClipboard(p.razorpay_payment_id); }}>
                <Copy size={14} />
              </button>
            </span>
          </div>
        {/if}
        <div class="detail-field">
          <span class="detail-label">Purchase Date</span>
          <span class="detail-value">{formatDate(p.created_at)}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Last Updated</span>
          <span class="detail-value">{formatDate(p.updated_at)}</span>
        </div>
      </div>

      {#if p.status === 'paid'}
        <div class="detail-actions">
          <a href="/account/downloads" class="btn btn-primary">
            <Download size={16} />
            Go to Downloads
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .detail-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: none;
    border: none;
    color: var(--color-text);
    opacity: 0.6;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    padding: 0;
    transition: opacity 0.2s;
  }

  .back-btn:hover {
    opacity: 1;
  }

  .section-card {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .section-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: var(--color-primary-green);
  }

  .section-card-header h2 {
    font-family: var(--font-heading);
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }

  .detail-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-glass-border);
  }

  .detail-field:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-size: 0.85rem;
    opacity: 0.6;
  }

  .detail-value {
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .detail-value.mono {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.8rem;
  }

  .copy-btn {
    background: none;
    border: none;
    color: var(--color-text);
    opacity: 0.4;
    cursor: pointer;
    padding: 2px;
    transition: opacity 0.2s;
  }

  .copy-btn:hover {
    opacity: 1;
  }

  .purchase-status {
    font-size: 0.75rem;
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

  .detail-actions {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-glass-border);
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

  .skeleton-card.tall {
    height: 300px;
    border-radius: 20px;
    background: var(--color-glass-bg);
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { opacity: 0.5; }
    50% { opacity: 0.8; }
    100% { opacity: 0.5; }
  }
</style>
