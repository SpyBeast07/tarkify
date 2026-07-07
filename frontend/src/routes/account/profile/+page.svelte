<script lang="ts">
  import { getContext } from 'svelte';
  import { onDestroy } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import {
    User, MapPin, AlertTriangle, CheckCircle, RefreshCw, Undo2, Mail, Send
  } from '@lucide/svelte';
  import {
    fetchProfile, updateProfile,
    type ProfileData, type ApiErrorBody,
  } from '$lib/api/account';
  import { sendVerificationEmail } from '$lib/api/auth';
  import type { AuthState } from '$lib/context/auth.svelte';
  import SectionCard from '$lib/components/ui/SectionCard.svelte';
  import StateCard from '$lib/components/ui/StateCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';

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

  function scheduleSaveSuccessDismiss() {
    clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      saveSuccess = false;
    }, 5000);
  }

  onDestroy(() => {
    clearTimeout(successTimer);
  });

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (isDirty) {
      e.preventDefault();
    }
  }

  $effect(() => {
    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  beforeNavigate(({ cancel }) => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) {
        cancel();
      }
    }
  });

  async function load() {
    loading = true;
    error = '';
    const result = await fetchProfile();
    if (!result) {
      error = 'Failed to load profile';
      if (authState.loaded) {
        authState.checkSession();
      }
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

  let verifyingEmail = $state(false);
  let verifySent = $state(false);
  let verifyError = $state('');

  async function handleVerifyEmail() {
    verifyError = '';
    verifySent = false;
    verifyingEmail = true;
    try {
      const result = await sendVerificationEmail(profile!.email);
      if ('error' in result) {
        verifyError = (result as ApiErrorBody).error?.message || 'Failed to send verification email';
      } else {
        verifySent = true;
      }
    } catch {
      verifyError = 'Failed to send verification email';
    } finally {
      verifyingEmail = false;
    }
  }
</script>

{#if loading}
  <Skeleton variant="card" />
  <Skeleton variant="card" class="tall" />
{:else if error}
  <StateCard type="error" icon={AlertTriangle} message={error}>
    <button class="btn btn-primary btn-sm" onclick={load}>
      <RefreshCw size={16} />
      Retry
    </button>
  </StateCard>
{:else if profile}
  <div class="page-content" aria-live="polite">
    <SectionCard icon={User} title="Profile" description="Manage your public profile information.">
      {#if saveSuccess}
        <Alert type="success">Profile updated successfully.</Alert>
      {/if}

      {#if saveError}
        <Alert type="error">{saveError}</Alert>
      {/if}

      <form onsubmit={handleSave} novalidate>
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <div class="input-container-wrapper input-with-icon input-readonly">
            <User size={18} class="input-icon" aria-hidden="true" />
            <input id="email" type="email" value={profile.email} disabled />
          </div>
          {#if !profile.emailVerified}
            <div class="verify-email-wrap">
              {#if verifySent}
                <span class="verify-success"><Send size={14} aria-hidden="true" /> Verification email sent</span>
              {:else}
                <button class="btn-text btn-verify" onclick={handleVerifyEmail} disabled={verifyingEmail}>
                  <Mail size={14} aria-hidden="true" />
                  {verifyingEmail ? 'Sending...' : 'Verify email address'}
                </button>
              {/if}
              {#if verifyError}
                <span class="error-text">{verifyError}</span>
              {/if}
            </div>
          {:else}
            <span class="verify-verified"><CheckCircle size={14} aria-hidden="true" /> Email verified</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="displayName" class="form-label">Display Name</label>
          <div class="input-container-wrapper input-with-icon">
            <User size={18} class="input-icon" aria-hidden="true" />
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
            <MapPin size={18} class="input-icon" aria-hidden="true" />
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
    </SectionCard>

    <SectionCard icon={User} title="Account Info">
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
    </SectionCard>
  </div>
{/if}

<style>
  .page-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-readonly input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .verify-email-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.375rem;
  }

  .btn-verify {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    color: var(--color-primary-green);
  }

  .btn-text {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  .btn-text:hover {
    text-decoration: underline;
  }

  .btn-text:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .verify-success,
  .verify-verified {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    color: #22c55e;
  }

  .error-text {
    color: #ef4444;
    font-size: 0.8rem;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-glass-border);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 0.8rem;
    opacity: 0.6;
  }

  .info-value {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .form-actions-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 0.25rem;
  }

  :global(.tall) {
    height: 200px;
  }

  @media (max-width: 640px) {
    .form-actions-row {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
