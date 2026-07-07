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
  import StateCard from '$lib/components/ui/StateCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';

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
  <Skeleton variant="list" count={3} />
{:else if error}
  <StateCard type="error" icon={AlertTriangle} message={error}>
    <button class="btn btn-primary btn-sm" onclick={load}>
      <RefreshCw size={16} />
      Retry
    </button>
  </StateCard>
{:else if data && data.downloads.length === 0}
  <StateCard type="empty" icon={Download} title="No downloads available" message="Products you purchase will appear here once your payment is confirmed.">
    <a href="/solutions" class="btn btn-primary">Browse Products</a>
  </StateCard>
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
  .downloads-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .download-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 16px;
    border: 1px solid var(--color-glass-border);
    backdrop-filter: var(--glass-blur);
    transition: var(--transition-smooth);
  }

  .download-card:hover {
    border-color: rgba(123, 144, 75, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(39, 59, 9, 0.06);
  }

  .download-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
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
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    font-weight: 500;
    padding: 0.25rem 0.625rem;
    border-radius: 8px;
  }

  .status-available {
    color: #16a34a;
    background: rgba(22, 163, 74, 0.08);
  }

  .status-pending {
    opacity: 0.65;
    background: var(--color-glass-bg);
  }

  @media (max-width: 640px) {
    .download-card {
      flex-wrap: wrap;
    }
  }
</style>
