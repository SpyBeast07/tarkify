<script lang="ts">
  import { getContext } from 'svelte';
  import {
    Package, Download, Clock, Calendar,
    Mail, CheckCircle, ArrowRight, RefreshCw, AlertTriangle
  } from '@lucide/svelte';
  import { sendVerificationEmail } from '$lib/api/auth';
  import {
    fetchDashboard,
    type DashboardData,
    type ApiErrorBody,
  } from '$lib/api/account';
  import type { AuthState } from '$lib/context/auth.svelte';
  import SectionCard from '$lib/components/ui/SectionCard.svelte';
  import StateCard from '$lib/components/ui/StateCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';

  const authState = getContext<AuthState>('auth');

  let data = $state<DashboardData | null>(null);
  let loading = $state(true);
  let error = $state('');

  let verificationSending = $state(false);
  let verificationSent = $state(false);
  let verificationError = $state('');

  async function load() {
    loading = true;
    error = '';
    const result = await fetchDashboard();
    if ('error' in result) {
      const err = result as ApiErrorBody;
      if (err.status === 401) {
        authState.clearUser();
        return;
      }
      error = err.error?.message || 'Failed to load dashboard';
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

  async function handleSendVerification() {
    if (!authState.user) return;
    verificationSending = true;
    verificationError = '';
    verificationSent = false;
    try {
      const result = await sendVerificationEmail(authState.user.email);
      if ('error' in result) {
        verificationError = (result as ApiErrorBody).error?.message || 'Failed to send verification email';
        return;
      }
      verificationSent = true;
    } catch {
      verificationError = 'An unexpected error occurred. Please try again.';
    } finally {
      verificationSending = false;
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
</script>

{#if loading}
  <Skeleton variant="card" />
  <div class="skeleton-row" aria-hidden="true">
    <Skeleton variant="card" />
    <Skeleton variant="card" />
  </div>
  <div class="skeleton-card tall" aria-hidden="true"></div>
{:else if error}
  <StateCard type="error" icon={AlertTriangle} message={error}>
    <button class="btn btn-primary btn-sm" onclick={load}>
      <RefreshCw size={16} />
      Retry
    </button>
  </StateCard>
{:else if data}
  <div class="dashboard" aria-live="polite">
    {#if authState.user && !authState.user.emailVerified}
      <div class="verify-banner glass">
        <div class="verify-banner-icon">
          <Mail size={24} aria-hidden="true" />
        </div>
        <div class="verify-banner-text">
          <h3>Verify Your Email</h3>
          <p>Please verify your email address to access all features.</p>
        </div>
        <div class="verify-banner-action">
          {#if verificationSent}
            <span class="verify-sent">
              <CheckCircle size={16} aria-hidden="true" />
              Verification email sent
            </span>
          {:else}
            <button
              class="btn btn-primary btn-sm"
              onclick={handleSendVerification}
              disabled={verificationSending}
            >
              {verificationSending ? 'Sending...' : 'Resend Verification'}
            </button>
          {/if}
        </div>
      </div>
      {#if verificationError}
        <Alert type="error">{verificationError}</Alert>
      {/if}
    {/if}

    <div class="welcome-card glass">
      <h2>Welcome back{data.summary.name ? `, ${data.summary.name}` : ''}!</h2>
      <div class="welcome-meta">
        <span class="welcome-meta-item">
          <Calendar size={14} aria-hidden="true" />
          Member since {formatDate(data.memberSince)}
        </span>
        <span class="welcome-meta-item">
          <CheckCircle size={14} aria-hidden="true" />
          {data.summary.accountStatus}
        </span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card glass">
        <div class="stat-icon purchases">
          <Package size={22} aria-hidden="true" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{data.totalPurchases}</span>
          <span class="stat-label">Total Purchases</span>
        </div>
      </div>
      <div class="stat-card glass">
        <div class="stat-icon downloads">
           <Download size={22} aria-hidden="true" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{data.activeDownloads}</span>
          <span class="stat-label">Active Downloads</span>
        </div>
      </div>
    </div>

    {#if data.recentActivity.length > 0}
      <SectionCard icon={Clock} title="Recent Activity">
        <div class="activity-list">
          {#each data.recentActivity as item}
            <a href="/account/purchases/{item.purchaseId}" class="activity-item">
              <div class="activity-info">
                <span class="activity-product">{item.productName}</span>
                <span class="activity-meta">
                  {item.currency} {(item.amount / 100).toFixed(2)} &middot; {item.status}
                </span>
              </div>
              <div class="activity-right">
                <span class="activity-date">{formatDate(item.createdAt)}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </div>
            </a>
          {/each}
        </div>
      </SectionCard>
    {:else}
      <StateCard type="empty" icon={Package} title="No purchases yet" message="Your recent activity will appear here once you make a purchase." />
    {/if}
  </div>
{/if}

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .welcome-card {
    padding: 1.25rem 1.5rem;
    border-radius: 20px;
    border: 1px solid var(--color-glass-border);
    backdrop-filter: var(--glass-blur);
  }

  .welcome-card h2 {
    font-family: var(--font-heading);
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 0.375rem;
  }

  .welcome-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .welcome-meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.85rem;
    opacity: 0.65;
  }

  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 16px;
    border: 1px solid var(--color-glass-border);
    backdrop-filter: var(--glass-blur);
    transition: var(--transition-smooth);
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(39, 59, 9, 0.08);
    border-color: rgba(123, 144, 75, 0.2);
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon.purchases {
    background: rgba(123, 144, 75, 0.15);
    color: var(--color-primary-green);
  }

  .stat-icon.downloads {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .stat-value {
    font-size: 1.65rem;
    font-weight: 700;
    font-family: var(--font-heading);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.8rem;
    opacity: 0.55;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 0.875rem;
    border-radius: 12px;
    border: 1px solid transparent;
    background: none;
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    width: 100%;
    font-family: inherit;
    text-decoration: none;
    transition: var(--transition-smooth);
  }

  .activity-item:hover {
    background: var(--color-glass-bg);
    border-color: rgba(123, 144, 75, 0.1);
  }

  .activity-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .activity-product {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .activity-meta {
    font-size: 0.8rem;
    opacity: 0.6;
  }

  .activity-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .activity-date {
    font-size: 0.8rem;
    opacity: 0.5;
  }

  .verify-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(251, 191, 36, 0.3);
    background: rgba(251, 191, 36, 0.06);
    backdrop-filter: var(--glass-blur);
  }

  .verify-banner-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(251, 191, 36, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f59e0b;
  }

  .verify-banner-text {
    flex: 1;
    min-width: 0;
  }

  .verify-banner-text h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
  }

  .verify-banner-text p {
    font-size: 0.85rem;
    opacity: 0.7;
    margin: 0;
  }

  .verify-banner-action {
    flex-shrink: 0;
  }

  .verify-sent {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.85rem;
    color: var(--color-primary-green);
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .skeleton-card.tall {
    height: 180px;
    border-radius: 20px;
    background: var(--color-glass-bg);
    animation: shimmer 1.5s infinite;
  }

  @media (max-width: 640px) {
    .stats-row {
      grid-template-columns: 1fr;
    }

    .verify-banner {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
