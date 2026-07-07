<script lang="ts">
  import { getContext } from 'svelte';
  import { onDestroy } from 'svelte';
  import {
    User, MapPin, AlertTriangle, CheckCircle, RefreshCw, Undo2
  } from '@lucide/svelte';
  import {
    fetchProfile, updateProfile,
    type ProfileData, type ApiErrorBody,
  } from '$lib/api/account';
  import type { AuthState } from '$lib/context/auth.svelte';

  const authState = getContext<AuthState>('auth');

  let profile = $state<ProfileData['user'] | null>(null);
  let loading = $state(true);
  let error = $state('');

  let displayName = $state('');
  let timezone = $state('');
  let saving = $state(false);
  let saveError = $state('');
  let saveSuccess = $state(false);

  let successTimer: ReturnType<typeof setTimeout> | undefined;

  const timezoneList = $derived(
    typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [
          'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
          'America/Los_Angeles', 'Europe/London', 'Europe/Berlin',
          'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai',
          'Australia/Sydney', 'Pacific/Auckland',
        ]
  );

  const allTimezoneOptions = $derived(
    timezone && !timezoneList.includes(timezone)
      ? [timezone, ...timezoneList]
      : timezoneList
  );

  const isDirty = $derived(
    displayName !== (profile?.displayName ?? '') || timezone !== (profile?.timezone ?? '')
  );

  function resetForm() {
    if (!profile) return;
    displayName = profile.displayName || '';
    timezone = profile.timezone || '';
    saveError = '';
    saveSuccess = false;
  }

  let cancelTimer: ReturnType<typeof setTimeout> | undefined;
  function scheduleSaveSuccessDismiss() {
    clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      saveSuccess = false;
    }, 5000);
  }

  onDestroy(() => {
    clearTimeout(successTimer);
  });

  async function load() {
    loading = true;
    error = '';
    const result = await fetchProfile();
    if (!result) {
      error = 'Failed to load profile';
    } else {
      profile = result.user;
      displayName = result.user.displayName || '';
      timezone = result.user.timezone || '';
    }
    loading = false;
  }

  $effect(() => {
    if (authState.loaded && authState.user) {
      load();
    }
  });

  async function handleSave(e: Event) {
    e.preventDefault();
    saveError = '';
    saveSuccess = false;
    saving = true;

    const result = await updateProfile({
      displayName: displayName.trim() || undefined,
      timezone: timezone.trim() || undefined,
    });

    if ('error' in result) {
      const err = result as ApiErrorBody;
      if (err.status === 401) {
        saving = false;
        authState.clearUser();
        return;
      }
      saveError = err.error?.message || 'Failed to update profile';
    } else {
      saveSuccess = true;
      if (profile) {
        profile.displayName = displayName.trim() || null;
        profile.timezone = timezone.trim() || null;
      }
      scheduleSaveSuccessDismiss();
    }
    saving = false;
  }
</script>

{#if loading}
  <div class="dashboard-skeleton" aria-hidden="true">
    <div class="skeleton-card"></div>
    <div class="skeleton-card tall" style="margin-top: 1rem"></div>
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
{:else if profile}
  <div class="page-content" aria-live="polite">
    <div class="section-card glass">
      <div class="section-card-header">
        <User size={20} />
        <h2>Profile</h2>
      </div>
      <p class="section-card-desc">Manage your public profile information.</p>

      {#if saveSuccess}
        <div class="success-alert" role="status">
          <CheckCircle size={20} />
          <span>Profile updated successfully.</span>
        </div>
      {/if}

      {#if saveError}
        <div class="form-alert form-alert-error" role="alert">
          <AlertTriangle size={16} />
          {saveError}
        </div>
      {/if}

      <form onsubmit={handleSave} novalidate>
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <div class="input-container-wrapper input-with-icon input-readonly">
            <User size={18} class="input-icon" />
            <input id="email" type="email" value={profile.email} disabled />
          </div>
        </div>

        <div class="form-group">
          <label for="displayName" class="form-label">Display Name</label>
          <div class="input-container-wrapper input-with-icon">
            <User size={18} class="input-icon" />
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              placeholder="Your display name"
              maxlength={100}
              disabled={saving}
            />
          </div>
        </div>

        <div class="form-group">
          <label for="timezone" class="form-label">Timezone</label>
          <div class="input-container-wrapper input-with-icon">
            <MapPin size={18} class="input-icon" />
            <select id="timezone" bind:value={timezone} disabled={saving}>
              <option value="">Select timezone...</option>
              {#each allTimezoneOptions as tz}
                <option value={tz}>{tz}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-actions-row">
          <button
            type="submit"
            class="btn btn-primary"
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {#if isDirty}
            <button
              type="button"
              class="btn btn-outline"
              onclick={resetForm}
              disabled={saving}
            >
              <Undo2 size={16} />
              Reset
            </button>
          {/if}
        </div>
      </form>
    </div>

    <div class="section-card glass">
      <div class="section-card-header">
        <User size={20} />
        <h2>Account Info</h2>
      </div>
      <div class="info-list">
        <div class="info-item">
          <span class="info-label">Role</span>
          <span class="info-value">{profile.role}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Account Status</span>
          <span class="info-value">{profile.accountStatus}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email Verified</span>
          <span class="info-value">{profile.emailVerified ? 'Yes' : 'No'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Member Since</span>
          <span class="info-value">{new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
        {#if profile.lastLoginAt}
          <div class="info-item">
            <span class="info-label">Last Login</span>
            <span class="info-value">{new Date(profile.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .page-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-card {
    padding: 1.5rem;
    border-radius: 20px;
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
    margin: 0 0 1.25rem;
  }

  .section-card :global(form) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-label {
    font-size: 0.85rem;
    font-weight: 500;
    opacity: 0.8;
  }

  .input-readonly input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .success-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background-color: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .form-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .form-alert-error {
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
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

  .state-card p {
    font-size: 0.9rem;
    margin: 0;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0;
    border-bottom: 1px solid var(--color-glass-border);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 0.85rem;
    opacity: 0.6;
  }

  .info-value {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .form-actions-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1rem;
    border: 1px solid var(--color-glass-border);
    border-radius: 10px;
    background: transparent;
    color: var(--color-text);
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .btn-outline:hover:not(:disabled) {
    background: var(--color-glass-bg);
    border-color: var(--color-accent-green);
  }

  .btn-outline:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

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
    height: 200px;
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
    .form-actions-row {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
