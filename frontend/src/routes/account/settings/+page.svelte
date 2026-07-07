<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Lock, Eye, EyeOff, LogOut,
    Monitor, Smartphone, Globe, Clock, RefreshCw,
    AlertTriangle, CheckCircle, Trash2, Settings as SettingsIcon,
    KeyRound
  } from '@lucide/svelte';
  import { changePassword, listSessions, revokeSession, revokeOtherSessions, deleteAccount } from '$lib/api/auth';
  import type { ApiErrorBody, ListedSession } from '$lib/api/auth';
  import type { AuthState } from '$lib/context/auth.svelte';
  import type { ToastState } from '$lib/context/toast.svelte';
  import SectionCard from '$lib/components/ui/SectionCard.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { getDeviceId } from '$lib/utils/device';

  const authState = getContext<AuthState>('auth');
  const toast = getContext<ToastState>('toast');

  // ── Change Password ──
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let showPasswords = $state(false);
  let passwordError = $state('');
  let passwordSuccess = $state(false);
  let changingPassword = $state(false);

  let pwValidationError = $derived(
    newPassword.length > 0 && newPassword.length < 8 ? 'Password must be at least 8 characters' : ''
  );
  let confirmError = $derived(
    confirmPassword.length > 0 && newPassword !== confirmPassword ? 'Passwords do not match' : ''
  );

  async function handleChangePassword(e: Event) {
    e.preventDefault();
    passwordError = '';
    passwordSuccess = false;

    if (newPassword !== confirmPassword) {
      passwordError = 'Passwords do not match';
      return;
    }
    if (newPassword.length < 8) {
      passwordError = 'Password must be at least 8 characters';
      return;
    }
    if (currentPassword === newPassword) {
      passwordError = 'New password must be different from current password';
      return;
    }

    changingPassword = true;
    try {
      const result = await changePassword(currentPassword, newPassword);
      if ('error' in result) {
        const err = result as ApiErrorBody;
        if (err.status === 401) {
          changingPassword = false;
          authState.clearUser();
          return;
        }
        passwordError = err.error?.message || 'Failed to change password';
        return;
      }
      passwordSuccess = true;
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      toast.addToast('Password changed successfully', 'success');
    } catch (err: any) {
      passwordError = err?.message || 'An unexpected error occurred';
    } finally {
      changingPassword = false;
    }
  }

  // ── Sessions ──
  let sessions = $state<ListedSession[]>([]);
  let sessionsLoading = $state(false);
  let sessionsError = $state('');
  let revokingToken = $state<string | null>(null);
  let revokingAll = $state(false);
  let currentDeviceId = $state('');

  async function loadSessions() {
    sessionsLoading = true;
    sessionsError = '';
    currentDeviceId = getDeviceId();
    try {
      const result = await listSessions();
      if ('error' in result) {
        const err = result as ApiErrorBody;
        if (err.status === 401) {
          authState.clearUser();
          return;
        }
        sessionsError = err.error?.message || 'Failed to load sessions';
      } else {
        sessions = result;
      }
    } catch {
      sessionsError = 'Failed to load sessions';
    } finally {
      sessionsLoading = false;
    }
  }

  async function handleRevoke(token: string) {
    revokingToken = token;
    try {
      const result = await revokeSession(token);
      if ('error' in result) {
        sessionsError = (result as ApiErrorBody).error?.message || 'Failed to revoke session';
      } else {
        sessions = sessions.filter(s => s.token !== token);
        toast.addToast('Session revoked', 'success');
      }
    } catch {
      sessionsError = 'Failed to revoke session';
    } finally {
      revokingToken = null;
    }
  }

  async function handleRevokeOthers() {
    revokingAll = true;
    try {
      const result = await revokeOtherSessions();
      if ('error' in result) {
        sessionsError = (result as ApiErrorBody).error?.message || 'Failed to revoke other sessions';
      } else {
        await loadSessions();
        toast.addToast('Other sessions revoked', 'success');
      }
    } catch {
      sessionsError = 'Failed to revoke other sessions';
    } finally {
      revokingAll = false;
    }
  }

  function sessionBrowser(session: ListedSession): string {
    return session.browser || 'Unknown';
  }

  function sessionOs(session: ListedSession): string {
    return session.os || 'Unknown';
  }

  function sessionDeviceName(session: ListedSession): string {
    if (session.deviceName) return session.deviceName;
    return `${sessionBrowser(session)} on ${sessionOs(session)}`;
  }

  function sessionLastActivity(session: ListedSession): string {
    const ts = session.lastSeen || session.updatedAt;
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // ── Delete Account ──
  let deletePassword = $state('');
  let deletingAccount = $state(false);
  let deleteError = $state('');
  let deleteSuccess = $state(false);

  async function handleDeleteAccount(e: Event) {
    e.preventDefault();
    deleteError = '';
    deleteSuccess = false;

    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    deletingAccount = true;
    try {
      const result = await deleteAccount(deletePassword);
      if ('error' in result) {
        const err = result as ApiErrorBody;
        if (err.status === 401) {
          deletingAccount = false;
          authState.clearUser();
          return;
        }
        deleteError = err.error?.message || 'Failed to delete account';
        return;
      }
      deleteSuccess = true;
      authState.clearUser();
      authState.broadcast();
      toast.addToast('Account deleted. Redirecting...', 'info');
      setTimeout(() => goto('/'), 2000);
    } catch (err: any) {
      deleteError = err?.message || 'An unexpected error occurred';
    } finally {
      deletingAccount = false;
    }
  }

  $effect(() => {
    if (authState.loaded && authState.user) {
      loadSessions();
    }
  });
</script>

<div class="settings-page">
  <SectionCard icon={Lock} title="Change Password" description="Update your password. Choose a strong, unique password.">
    {#if passwordError}
      <Alert type="error">{passwordError}</Alert>
    {/if}

    <form onsubmit={handleChangePassword} novalidate>
      <div class="form-group">
        <label for="currentPassword" class="form-label">Current Password</label>
        <div class="input-container-wrapper input-with-icon">
          <Lock size={18} class="input-icon" aria-hidden="true" />
          <input
            id="currentPassword"
            type={showPasswords ? 'text' : 'password'}
            bind:value={currentPassword}
            required
            autocomplete="current-password"
            disabled={changingPassword}
            placeholder="Enter current password"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="newPassword" class="form-label">New Password</label>
        <div class="input-container-wrapper input-with-icon">
          <Lock size={18} class="input-icon" aria-hidden="true" />
          <input
            id="newPassword"
            type={showPasswords ? 'text' : 'password'}
            bind:value={newPassword}
            required
            autocomplete="new-password"
            disabled={changingPassword}
            placeholder="At least 8 characters"
          />
        </div>
        {#if pwValidationError}
          <span class="error-text">{pwValidationError}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="confirmPassword" class="form-label">Confirm New Password</label>
        <div class="input-container-wrapper input-with-icon">
          <Lock size={18} class="input-icon" aria-hidden="true" />
          <input
            id="confirmPassword"
            type={showPasswords ? 'text' : 'password'}
            bind:value={confirmPassword}
            required
            autocomplete="new-password"
            disabled={changingPassword}
            placeholder="Repeat new password"
          />
        </div>
        {#if confirmError}
          <span class="error-text">{confirmError}</span>
        {/if}
      </div>

      <div class="form-actions">
        <button type="button" class="btn-text" onclick={() => (showPasswords = !showPasswords)}>
          {#if showPasswords}
            <EyeOff size={16} aria-hidden="true" />
          {:else}
            <Eye size={16} aria-hidden="true" />
          {/if}
          {showPasswords ? 'Hide' : 'Show'} passwords
        </button>
      </div>

      <button
        type="submit"
        class="btn btn-primary"
        disabled={changingPassword || !!pwValidationError || !!confirmError || !currentPassword || !newPassword || !confirmPassword}
      >
        {changingPassword ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  </SectionCard>

  <SectionCard icon={KeyRound} title="Active Sessions" description="Manage your active sessions. Revoke any session you don't recognize.">
    {#if sessionsError}
      <Alert type="error">{sessionsError}</Alert>
    {/if}

    {#if sessions.length > 1}
      <div class="revoke-all-wrap">
        <button
          onclick={handleRevokeOthers}
          disabled={revokingAll}
        >
          <LogOut size={16} aria-hidden="true" />
          {revokingAll ? 'Revoking...' : 'Sign out of all other sessions'}
        </button>
      </div>
    {/if}

    {#if sessionsLoading}
      <div class="loading-state">Loading sessions...</div>
    {:else if sessions.length === 0}
      <div class="empty-state">No active sessions found.</div>
    {:else}
      <div class="sessions-list" aria-live="polite">
        {#each sessions as session (session.id)}
          {@const devName = sessionDeviceName(session)}
          {@const browser = sessionBrowser(session)}
          {@const os = sessionOs(session)}
          {@const isCurrent = session.token === authState.currentSessionToken || (currentDeviceId && session.deviceId === currentDeviceId)}
          {@const iconSize = session.deviceType === 'mobile' ? 18 : 20}
          <div class="session-card" class:current-session={isCurrent}>
            <div class="session-icon">
              {#if session.deviceType === 'mobile'}
                <Smartphone size={iconSize} aria-hidden="true" />
              {:else if session.deviceType === 'tablet'}
                <Smartphone size={iconSize} aria-hidden="true" />
              {:else}
                <Monitor size={iconSize} aria-hidden="true" />
              {/if}
            </div>
            <div class="session-info">
              <div class="session-meta">
                <span class="session-browser">{devName}</span>
                {#if isCurrent}
                  <span class="current-badge">Current</span>
                {/if}
              </div>
              <div class="session-details">
                {#if browser !== 'Unknown'}
                  <span class="session-detail">
                    <Globe size={12} aria-hidden="true" />
                    {browser} &middot; {os}
                  </span>
                {/if}
                {#if session.ipAddress}
                  <span class="session-detail">
                    <Globe size={12} aria-hidden="true" />
                    {session.ipAddress}
                  </span>
                {/if}
                <span class="session-detail">
                  <Clock size={12} aria-hidden="true" />
                  Logged in {timeAgo(session.createdAt)}
                </span>
                <span class="session-detail">
                  <RefreshCw size={12} aria-hidden="true" />
                  Active {sessionLastActivity(session)}
                </span>
              </div>
            </div>
            <div class="session-action">
              {#if isCurrent}
                <span class="current-label">Current session</span>
              {:else}
                <button
                  class="btn btn-outline btn-xs"
                  onclick={() => handleRevoke(session.token)}
                  disabled={revokingToken === session.token}
                >
                  {revokingToken === session.token ? 'Revoking...' : 'Revoke'}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if !sessionsLoading && sessions.length > 0}
      <button class="refresh-btn" onclick={loadSessions} style="margin-top: 0.75rem">
        <RefreshCw size={14} aria-hidden="true" />
        Refresh sessions
      </button>
    {/if}
  </SectionCard>

  <SectionCard icon={SettingsIcon} title="Account Settings" description="Manage your account settings and data.">
    <div class="delete-account-section">
      <div class="delete-account-warning glass">
        <div class="delete-warning-icon">
          <AlertTriangle size={24} aria-hidden="true" />
        </div>
        <div class="delete-warning-text">
          <h3>Delete Account</h3>
          <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          <ul>
            <li>Your profile and account information will be deactivated.</li>
            <li>Your purchases, invoices, and download history will be preserved for record-keeping.</li>
            <li>You will be signed out of all sessions immediately.</li>
            <li>You will not be able to log in again. Contact support to recover your account.</li>
          </ul>
        </div>
      </div>

      {#if deleteError}
        <Alert type="error">{deleteError}</Alert>
      {/if}

      {#if deleteSuccess}
        <Alert type="success">Account deleted. Redirecting...</Alert>
      {:else}
        <form onsubmit={handleDeleteAccount} novalidate>
          <div class="form-group">
            <label for="deletePassword" class="form-label">Confirm your password to delete your account</label>
            <div class="input-container-wrapper input-with-icon">
              <Lock size={18} class="input-icon" aria-hidden="true" />
              <input
                id="deletePassword"
                type="password"
                bind:value={deletePassword}
                required
                autocomplete="current-password"
                disabled={deletingAccount}
                placeholder="Enter current password"
              />
            </div>
          </div>
          <button
            type="submit"
            class="btn btn-danger"
            disabled={deletingAccount || !deletePassword}
          >
            <Trash2 size={16} aria-hidden="true" />
            {deletingAccount ? 'Deleting Account...' : 'Delete My Account'}
          </button>
        </form>
      {/if}
    </div>
  </SectionCard>
</div>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .error-text {
    color: #ef4444;
    font-size: 0.8rem;
  }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-text {
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
  }

  .btn-text:hover {
    opacity: 1;
  }

  .revoke-all-wrap {
    margin-bottom: 0.75rem;
  }

  .revoke-all-wrap button,
  .refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    border: 1px solid var(--color-glass-border);
    background: var(--color-glass-bg);
    color: var(--color-text);
    opacity: 0.7;
    transition: var(--transition-smooth);
  }

  .revoke-all-wrap button:hover,
  .refresh-btn:hover {
    opacity: 1;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .revoke-all-wrap button:disabled,
  .refresh-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .loading-state,
  .empty-state {
    text-align: center;
    padding: 1.5rem;
    opacity: 0.6;
    font-size: 0.9rem;
  }

  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .session-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 14px;
    border: 1px solid var(--color-glass-border);
    background: var(--color-glass-bg);
    backdrop-filter: var(--glass-blur);
    transition: var(--transition-smooth);
  }

  .session-card:hover {
    border-color: rgba(123, 144, 75, 0.15);
  }

  .session-card.current-session {
    border-color: var(--color-accent-green);
    background: rgba(123, 144, 75, 0.06);
  }

  .session-icon {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: var(--color-glass-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }

  .session-info {
    flex: 1;
    min-width: 0;
  }

  .session-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .session-browser {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .current-badge {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 6px;
    background: var(--color-accent-green);
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .session-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .session-detail {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    opacity: 0.6;
  }

  .session-action {
    flex-shrink: 0;
  }

  .current-label {
    font-size: 0.8rem;
    opacity: 0.5;
    font-style: italic;
  }

  .delete-account-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-glass-border);
  }

  .delete-account-warning {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 16px;
    margin-bottom: 1.25rem;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.06);
  }

  .delete-warning-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
  }

  .delete-warning-text {
    flex: 1;
    min-width: 0;
  }

  .delete-warning-text h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
    color: #ef4444;
  }

  .delete-warning-text p {
    font-size: 0.85rem;
    opacity: 0.7;
    margin: 0 0 0.75rem;
  }

  .delete-warning-text ul {
    font-size: 0.8rem;
    opacity: 0.6;
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .delete-warning-text ul li {
    line-height: 1.5;
  }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    color: #fff;
    background: #ef4444;
    transition: var(--transition-smooth);
  }

  .btn-danger:hover {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
  }

  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 640px) {
    .delete-account-warning {
      flex-direction: column;
      text-align: center;
    }

    .delete-warning-icon {
      margin: 0 auto;
    }

    .delete-warning-text ul {
      text-align: left;
    }
  }
</style>
