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
  <div class="dashboard-skeleton" aria-hidden="true">
    <div class="skeleton-card"></div>
    <div class="skeleton-row">
      <div class="skeleton-stat"></div>
      <div class="skeleton-stat"></div>
    </div>
    <div class="skeleton-card tall"></div>
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
{:else if data}
  <div class="dashboard" aria-live="polite">
    {#if authState.user && !authState.user.emailVerified}
      <div class="verify-banner glass">
        <div class="verify-banner-icon">
          <Mail size={24} />
        </div>
        <div class="verify-banner-text">
          <h3>Verify Your Email</h3>
          <p>Please verify your email address to access all features.</p>
        </div>
        <div class="verify-banner-action">
          {#if verificationSent}
            <span class="verify-sent">
              <CheckCircle size={16} />
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
        <div class="form-alert form-alert-error" role="alert">{verificationError}</div>
      {/if}
    {/if}

    <div class="welcome-card glass">
      <h2>Welcome back{data.summary.name ? `, ${data.summary.name}` : ''}!</h2>
      <div class="welcome-meta">
        <span class="welcome-meta-item">
          <Calendar size={14} />
          Member since {formatDate(data.memberSince)}
        </span>
        <span class="welcome-meta-item">
          <CheckCircle size={14} />
          {data.summary.accountStatus}
        </span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card glass">
        <div class="stat-icon purchases">
          <Package size={22} />
        </div>
        <div class="stat-info">
          <span class="stat-value">{data.totalPurchases}</span>
          <span class="stat-label">Total Purchases</span>
        </div>
      </div>
      <div class="stat-card glass">
        <div class="stat-icon downloads">
          <Download size={22} />
        </div>
        <div class="stat-info">
          <span class="stat-value">{data.activeDownloads}</span>
          <span class="stat-label">Active Downloads</span>
        </div>
      </div>
    </div>

    {#if data.recentActivity.length > 0}
      <div class="section-card glass">
        <div class="section-card-header">
          <Clock size={18} />
          <h3>Recent Activity</h3>
        </div>
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
                <ArrowRight size={14} />
              </div>
            </a>
          {/each}
        </div>
      </div>
    {:else}
      <div class="state-card empty glass">
        <Package size={32} />
        <h3>No purchases yet</h3>
        <p>Your recent activity will appear here once you make a purchase.</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* ── Welcome Card ── */
  .welcome-card {
    padding: 1.5rem 1.75rem;
    border-radius: 20px;
  }

  .welcome-card h2 {
    font-family: var(--font-heading);
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }

  .welcome-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .welcome-meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.85rem;
    opacity: 0.65;
  }

  /* ── Stats ── */
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
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
    background: rgba(88, 100, 29, 0.15);
    color: var(--color-secondary-green);
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    font-family: var(--font-heading);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.8rem;
    opacity: 0.6;
  }

  /* ── Activity ── */
  .section-card {
    padding: 1.25rem;
    border-radius: 20px;
  }

  .section-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    color: var(--color-primary-green);
  }

  .section-card-header h3 {
    font-family: var(--font-heading);
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0.875rem;
    border-radius: 12px;
    border: none;
    background: none;
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    width: 100%;
    font-family: inherit;
    text-decoration: none;
    transition: background 0.2s;
  }

  .activity-item:hover {
    background: var(--color-glass-bg);
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

  /* ── Verification Banner ── */
  .verify-banner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 16px;
    border: 1px solid rgba(251, 191, 36, 0.3);
    background: rgba(251, 191, 36, 0.06);
  }

  .verify-banner-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
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

  .form-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
  }

  .form-alert-error {
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
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

  /* ── Skeleton ── */
  .dashboard-skeleton {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .skeleton-card {
    height: 80px;
    border-radius: 20px;
    background: var(--color-glass-bg);
    animation: shimmer 1.5s infinite;
  }

  .skeleton-card.tall {
    height: 180px;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .skeleton-stat {
    height: 80px;
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
    .dashboard-skeleton * {
      animation: none;
    }
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
