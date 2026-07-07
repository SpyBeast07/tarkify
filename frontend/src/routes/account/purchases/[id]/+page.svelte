<script lang="ts">
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  import {
    Receipt, ArrowLeft, AlertTriangle, RefreshCw, Copy, Download
  } from '@lucide/svelte';
  import {
    fetchPurchase,
    type PurchaseRow, type ApiErrorBody,
  } from '$lib/api/account';
  import type { AuthState } from '$lib/context/auth.svelte';
  import type { ToastState } from '$lib/context/toast.svelte';
  import SectionCard from '$lib/components/ui/SectionCard.svelte';
  import StateCard from '$lib/components/ui/StateCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';

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
      if (errBody.status === 401) {
        authState.clearUser();
        return;
      }
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

  async function copyToClipboard(val: string, label: string) {
    try {
      await navigator.clipboard.writeText(val);
      toast.addToast(`${label} copied to clipboard`, 'success');
    } catch {
      toast.addToast('Failed to copy', 'error');
    }
  }
</script>

<div class="detail-page">
  <a href="/account/purchases" class="back-btn">
    <ArrowLeft size={16} aria-hidden="true" />
    Back to Purchases
  </a>

  {#if loading}
    <div class="skeleton-card tall" aria-hidden="true"></div>
  {:else if error}
    <StateCard type="error" icon={AlertTriangle} message={error}>
      <button class="btn btn-primary btn-sm" onclick={load}>
        <RefreshCw size={16} aria-hidden="true" />
        Retry
      </button>
    </StateCard>
  {:else if purchase}
    {@const p = purchase}
    <SectionCard icon={Receipt} title="Purchase Details">
      <div class="detail-grid">
        <div class="detail-field">
          <span class="detail-label">Product</span>
          <span class="detail-value">{p.product_name}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Status</span>
          <StatusBadge status={statusLabel(p.status)} />
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
              <button class="copy-btn" onclick={() => copyToClipboard(p.razorpay_order_id, 'Order ID')} aria-label="Copy order ID">
                <Copy size={14} aria-hidden="true" />
              </button>
            </span>
          </div>
        {/if}
        {#if p.razorpay_payment_id}
          <div class="detail-field">
            <span class="detail-label">Payment ID</span>
            <span class="detail-value mono">
              {p.razorpay_payment_id}
              <button class="copy-btn" onclick={() => { if (p.razorpay_payment_id) copyToClipboard(p.razorpay_payment_id, 'Payment ID'); }} aria-label="Copy payment ID">
                <Copy size={14} aria-hidden="true" />
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
            <Download size={16} aria-hidden="true" />
            Go to Downloads
          </a>
        </div>
      {/if}
    </SectionCard>
  {/if}
</div>

<style>
  .detail-page {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: var(--color-glass-bg);
    border: 1px solid var(--color-glass-border);
    border-radius: 10px;
    color: var(--color-text);
    opacity: 0.65;
    cursor: pointer;
    font-size: 0.8rem;
    font-family: inherit;
    padding: 0.375rem 0.75rem;
    text-decoration: none;
    transition: var(--transition-smooth);
    align-self: flex-start;
  }

  .back-btn:hover {
    opacity: 1;
    border-color: rgba(123, 144, 75, 0.2);
    transform: translateX(-2px);
  }

  .detail-grid {
    display: flex;
    flex-direction: column;
  }

  .detail-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-glass-border);
    gap: 0.75rem;
  }

  .detail-field:first-child {
    padding-top: 0;
  }

  .detail-field:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .detail-label {
    font-size: 0.8rem;
    opacity: 0.55;
    flex-shrink: 0;
  }

  .detail-value {
    font-size: 0.85rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    text-align: right;
  }

  .detail-value.mono {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.75rem;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-glass-bg);
    border: 1px solid var(--color-glass-border);
    border-radius: 6px;
    color: var(--color-text);
    opacity: 0.4;
    cursor: pointer;
    padding: 0.25rem;
    transition: var(--transition-smooth);
  }

  .copy-btn:hover {
    opacity: 1;
    border-color: rgba(123, 144, 75, 0.3);
  }

  .detail-actions {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-glass-border);
  }

  .skeleton-card.tall {
    height: 260px;
    border-radius: 20px;
    background: var(--color-glass-bg);
    border: 1px solid var(--color-glass-border);
    animation: shimmer 1.5s infinite;
  }
</style>
