<script lang="ts">
  import { getContext } from 'svelte';
  import {
    Download, AlertTriangle, RefreshCw, CheckCircle, Clock
  } from '@lucide/svelte';
  import {
    fetchDownloads, generateDownloadToken, API_ORIGIN,
    type DownloadsResponse, type DownloadRow, type ApiErrorBody,
  } from '$lib/api/account';
  import type { AuthState } from '$lib/context/auth.svelte';
  import type { ToastState } from '$lib/context/toast.svelte';

  const authState = getContext<AuthState>('auth');
  const toast = getContext<ToastState>('toast');

  let data = $state<DownloadsResponse | null>(null);
  let loading = $state(true);
  let error = $state('');
  let downloadingId = $state<string | null>(null);

  async function load() {
    loading = true;
    error = '';
    const result = await fetchDownloads();
    if ('error' in result) {
      const err = result as ApiErrorBody;
      if (err.status === 401) {
        authState.clearUser();
        return;
      }
      error = err.error?.message || 'Failed to load downloads';
    } else {
      data = result;
    }
    loading = false;
  }

  $effect(() => {
    if (authState.loaded && authState.user) {
      load();
    }
  });

  async function handleDownload(item: DownloadRow) {
    downloadingId = item.entitlement_id;
    try {
      const result = await generateDownloadToken(item.purchase_id);
      if ('error' in result) {
        const err = result as ApiErrorBody;
        if (err.status === 401) {
          authState.clearUser();
          return;
        }
        toast.addToast('Failed to generate download link', 'error');
      } else {
        window.open(API_ORIGIN + result.downloadUrl, '_blank');
        toast.addToast('Download started', 'success');
      }
    } catch {
      toast.addToast('Download failed. Please try again.', 'error');
    } finally {
      downloadingId = null;
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }
</script>

<div class="page-header">
  <div class="section-card-header">
    <Download size={20} />
    <h2>Downloads</h2>
  </div>
  <p class="section-card-desc">Access your purchased products and download the latest versions.</p>
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
{:else if data && data.downloads.length === 0}
  <div class="state-card empty">
    <Download size={32} />
    <h3>No downloads available</h3>
    <p>Products you purchase will appear here once your payment is confirmed.</p>
    <a href="/solutions" class="btn btn-primary">Browse Products</a>
  </div>
{:else if data}
  <div class="downloads-list" aria-live="polite">
    {#each data.downloads as item (item.entitlement_id)}
      <div class="download-card glass">
        <div class="download-icon" aria-hidden="true">
          <Download size={20} />
        </div>
        <div class="download-info">
          <span class="download-product">{item.product_name}</span>
          <span class="download-meta">
            Purchased {formatDate(item.granted_at)}
          </span>
        </div>
        <div class="download-status">
          {#if item.has_valid_token}
            <span class="status-available">
              <CheckCircle size={14} />
              Ready
            </span>
          {:else}
            <span class="status-pending">
              <Clock size={14} />
              Generate
            </span>
          {/if}
        </div>
        <button
          class="btn btn-primary btn-sm"
          onclick={() => handleDownload(item)}
          disabled={downloadingId === item.entitlement_id}
          aria-label="Download {item.product_name}"
        >
          {downloadingId === item.entitlement_id ? 'Preparing...' : 'Download'}
        </button>
      </div>
    {/each}
  </div>
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

  .downloads-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .download-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 16px;
  }

  .download-icon {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(123, 144, 75, 0.15);
    color: var(--color-primary-green);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .download-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .download-product {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .download-meta {
    font-size: 0.8rem;
    opacity: 0.6;
  }

  .download-status {
    flex-shrink: 0;
  }

  .status-available,
  .status-pending {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .status-available {
    color: #22c55e;
  }

  .status-pending {
    opacity: 0.6;
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

  @media (max-width: 640px) {
    .download-card {
      flex-wrap: wrap;
    }
  }
</style>
