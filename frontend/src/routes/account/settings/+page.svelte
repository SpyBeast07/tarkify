<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Lock, Eye, EyeOff, ShieldCheck, LogOut,
    Monitor, Smartphone, Globe, Clock, RefreshCw,
    AlertTriangle, CheckCircle, Trash2, Settings as SettingsIcon,
    KeyRound
  } from '@lucide/svelte';
  import { changePassword, listSessions, revokeSession, revokeOtherSessions, deleteAccount } from '$lib/api/auth';
  import type { ApiErrorBody, ListedSession } from '$lib/api/auth';
  import type { AuthState } from '$lib/context/auth.svelte';
  import type { ToastState } from '$lib/context/toast.svelte';

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
        passwordError = (result as ApiErrorBody).error?.message || 'Failed to change password';
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

  async function loadSessions() {
    sessionsLoading = true;
    sessionsError = '';
    try {
      const result = await listSessions();
      if ('error' in result) {
        sessionsError = (result as ApiErrorBody).error?.message || 'Failed to load sessions';
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

  function parseUserAgent(ua: string | null): { browser: string; os: string } {
    if (!ua) return { browser: 'Unknown', os: 'Unknown' };
    let browser = 'Unknown';
    let os = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
    return { browser, os };
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
        deleteError = (result as ApiErrorBody).error?.message || 'Failed to delete account';
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
</script>

<div class="settings-page">
  <!-- ── Change Password ── -->
  <div class="section-card glass">
    <div class="section-card-header">
      <Lock size={20} />
      <h2>Change Password</h2>
    </div>
    <p class="section-card-desc">Update your password. Choose a strong, unique password.</p>

    {#if passwordError}
      <div class="form-alert form-alert-error" role="alert">
        <AlertTriangle size={16} />
        {passwordError}
      </div>
    {/if}

    <form onsubmit={handleChangePassword} novalidate>
      <div class="form-group">
        <label for="currentPassword" class="form-label">Current Password</label>
        <div class="input-container-wrapper input-with-icon">
          <Lock size={18} class="input-icon" />
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
          <Lock size={18} class="input-icon" />
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
          <Lock size={18} class="input-icon" />
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
          <Eye size={16} />
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
  </div>

  <!-- ── Sessions ── -->
  <div class="section-card glass">
    <div class="section-card-header">
      <KeyRound size={20} />
      <h2>Active Sessions</h2>
    </div>
    <p class="section-card-desc">
      Manage your active sessions. Revoke any session you don't recognize.
    </p>

    {#if sessionsError}
      <div class="form-alert form-alert-error" role="alert">
        <AlertTriangle size={16} />
        {sessionsError}
      </div>
    {/if}

    {#if sessions.length > 1}
      <div class="revoke-all-wrap">
        <button
          class="btn btn-outline btn-sm"
          onclick={handleRevokeOthers}
          disabled={revokingAll}
        >
          <LogOut size={16} />
          {revokingAll ? 'Revoking...' : 'Sign out of all other sessions'}
        </button>
      </div>
    {/if}

    {#if sessionsLoading && sessions.length === 0}
      <div class="loading-state">Loading sessions...</div>
    {:else if sessions.length === 0}
      <div class="empty-state">No active sessions found.</div>
    {:else}
      <div class="sessions-list">
        {#each sessions as session (session.id)}
          {@const info = parseUserAgent(session.userAgent)}
          {@const isCurrent = session.token === authState.currentSessionToken}
          <div class="session-card" class:current-session={isCurrent}>
            <div class="session-icon">
              {#if info.os === 'macOS' || info.os === 'Windows' || info.os === 'Linux'}
                <Monitor size={20} />
              {:else}
                <Smartphone size={20} />
              {/if}
            </div>
            <div class="session-info">
              <div class="session-meta">
                <span class="session-browser">{info.browser} on {info.os}</span>
                {#if isCurrent}
                  <span class="current-badge">Current</span>
                {/if}
              </div>
              <div class="session-details">
                {#if session.ipAddress}
                  <span class="session-detail">
                    <Globe size={12} />
                    {session.ipAddress}
                  </span>
                {/if}
                <span class="session-detail">
                  <Clock size={12} />
                  Logged in {timeAgo(session.createdAt)}
                </span>
                <span class="session-detail">
                  <RefreshCw size={12} />
                  Last activity {timeAgo(session.updatedAt)}
                </span>
              </div>
            </div>
            <div class="session-action">
              {#if isCurrent}
                <span class="current-label">Current</span>
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
      <button class="btn btn-outline btn-sm" onclick={loadSessions} style="margin-top: 0.75rem">
        <RefreshCw size={14} />
        Refresh sessions
      </button>
    {/if}
  </div>

  <!-- ── Delete Account ── -->
  <div class="section-card glass">
    <div class="section-card-header">
      <SettingsIcon size={20} />
      <h2>Account Settings</h2>
    </div>
    <p class="section-card-desc">Manage your account settings and data.</p>

    <div class="delete-account-section">
      <div class="delete-account-warning glass">
        <div class="delete-warning-icon">
          <AlertTriangle size={24} />
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
        <div class="form-alert form-alert-error" role="alert">
          <AlertTriangle size={16} />
          {deleteError}
        </div>
      {/if}

      {#if deleteSuccess}
        <div class="success-alert">
          <CheckCircle size={20} />
          <span>Account deleted. Redirecting...</span>
        </div>
      {:else}
        <form onsubmit={handleDeleteAccount} novalidate>
          <div class="form-group">
            <label for="deletePassword" class="form-label">Confirm your password to delete your account</label>
            <div class="input-container-wrapper input-with-icon">
              <Lock size={18} class="input-icon" />
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
            <Trash2 size={16} />
            {deletingAccount ? 'Deleting Account...' : 'Delete My Account'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-page {
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

  /* ── Sessions ── */
  .revoke-all-wrap {
    margin-bottom: 0.75rem;
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
    gap: 0.875rem;
    padding: 0.875rem;
    border-radius: 14px;
    border: 1px solid var(--color-glass-border);
    transition: border-color 0.2s;
  }

  .session-card.current-session {
    border-color: var(--color-primary-green);
    background: rgba(34, 197, 94, 0.03);
  }

  .session-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 10px;
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
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 6px;
    background: var(--color-primary-green);
    color: #fff;
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

  /* ── Delete Account ── */
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
    transition: background 0.2s, opacity 0.2s;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
