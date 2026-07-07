<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import {
		User, Download, Receipt, CreditCard,
		Lock, Eye, EyeOff, ShieldCheck, LogOut,
		Monitor, Smartphone, Globe, Clock, CheckCircle, XCircle,
		Mail, Send, AlertTriangle, RefreshCw, Settings, Trash2
	} from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { changePassword, sendVerificationEmail, listSessions, revokeSession, revokeOtherSessions, deleteAccount } from '$lib/api/auth';
	import type { ListedSession } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	const authState = getContext<AuthState>('auth');

	if (!authState.loaded || !authState.user) {
		goto('/account/login?redirect=/account');
	}

	let activeTab = $state<'overview' | 'security' | 'sessions' | 'settings'>('overview');

	// ── Email Verification ──
	let verificationSending = $state(false);
	let verificationSent = $state(false);
	let verificationError = $state('');

	async function handleSendVerification() {
		if (!authState.user) return;
		verificationSending = true;
		verificationError = '';
		verificationSent = false;
		try {
			const result = await sendVerificationEmail(authState.user.email);
			if (result.error) {
				verificationError = result.error.message || 'Failed to send verification email';
				return;
			}
			verificationSent = true;
		} catch {
			verificationError = 'An unexpected error occurred. Please try again.';
		} finally {
			verificationSending = false;
		}
	}

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
			if (result.error) {
				passwordError = result.error.message || 'Failed to change password';
				return;
			}
			passwordSuccess = true;
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (err: any) {
			passwordError = err?.message || 'An unexpected error occurred. Please try again.';
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
			sessions = await listSessions();
		} catch {
			sessionsError = 'Failed to load sessions';
		} finally {
			sessionsLoading = false;
		}
	}

	async function handleRevoke(token: string) {
		revokingToken = token;
		try {
			await revokeSession(token);
			sessions = sessions.filter(s => s.token !== token);
		} catch {
			sessionsError = 'Failed to revoke session';
		} finally {
			revokingToken = null;
		}
	}

	async function handleRevokeOthers() {
		revokingAll = true;
		try {
			await revokeOtherSessions();
			await loadSessions();
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
			if (result.error) {
				deleteError = result.error.message || 'Failed to delete account';
				return;
			}
			deleteSuccess = true;
			authState.clearUser();
			authState.broadcast();
			setTimeout(() => goto('/'), 2000);
		} catch (err: any) {
			deleteError = err?.message || 'An unexpected error occurred. Please try again.';
		} finally {
			deletingAccount = false;
		}
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
	title="Account | Tarkify"
	description="Manage your Tarkify account, security, and sessions."
	ogImage="/og-image.svg"
	ogType="website"
/>

<div class="account-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="account-hero">
			<span class="section-badge">Account</span>
			<h1>Customer Portal</h1>
		</div>

		<!-- Tabs -->
		<div class="account-tabs" transition:fly={{ y: 20, duration: 400, delay: 100 }}>
			<button
				class="tab-btn"
				class:active={activeTab === 'overview'}
				onclick={() => (activeTab = 'overview')}
			>
				<User size={16} />
				Overview
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'security'}
				onclick={() => (activeTab = 'security')}
			>
				<Lock size={16} />
				Security
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'sessions'}
				onclick={() => { activeTab = 'sessions'; loadSessions(); }}
			>
				<Monitor size={16} />
				Sessions
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'settings'}
				onclick={() => (activeTab = 'settings')}
			>
				<Settings size={16} />
				Settings
			</button>
		</div>

		<!-- ── Overview Tab ── -->
		{#if activeTab === 'overview'}
			<div class="tab-content" transition:fly={{ y: 12, duration: 250 }}>
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
						<div class="form-alert form-alert-error">{verificationError}</div>
					{/if}
				{/if}

				<div class="account-coming-soon glass">
					<div class="account-icon-wrapper">
						<User size={32} />
					</div>
					<h2>Coming Soon</h2>
					<p>
						We're building a full customer portal where you'll be able to manage your downloads, view
						purchase history, and handle billing.
					</p>
					<div class="account-features-preview">
						<div class="account-feature-item">
							<Download size={20} />
							<span>Downloads</span>
						</div>
						<div class="account-feature-item">
							<Receipt size={20} />
							<span>Purchases</span>
						</div>
						<div class="account-feature-item">
							<CreditCard size={20} />
							<span>Billing</span>
						</div>
					</div>
				</div>
			</div>

		<!-- ── Security Tab ── -->
		{:else if activeTab === 'security'}
			<div class="tab-content" transition:fly={{ y: 12, duration: 250 }}>
				<div class="section-card glass">
					<div class="section-card-header">
						<Lock size={20} />
						<h2>Change Password</h2>
					</div>
					<p class="section-card-desc">Update your password. Choose a strong, unique password.</p>

					{#if passwordSuccess}
						<div class="success-alert">
							<ShieldCheck size={20} />
							<span>Password changed successfully.</span>
						</div>
					{/if}

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
			</div>

		<!-- ── Sessions Tab ── -->
		{:else if activeTab === 'sessions'}
			<div class="tab-content" transition:fly={{ y: 12, duration: 250 }}>
				<div class="section-card glass">
					<div class="section-card-header">
						<Monitor size={20} />
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

					{#if sessionsLoading}
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
				</div>
			</div>
		<!-- ── Settings Tab ── -->
		{:else if activeTab === 'settings'}
			<div class="tab-content" transition:fly={{ y: 12, duration: 250 }}>
				<div class="section-card glass">
					<div class="section-card-header">
						<Settings size={20} />
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
		{/if}
	</div>
</div>

<style>
	.account-page {
		min-height: 60vh;
	}

	.account-hero {
		margin-bottom: 1.5rem;
	}

	.account-hero h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	/* ── Tabs ── */
	.account-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--color-glass-border);
		padding-bottom: 0;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: none;
		background: none;
		color: var(--color-text);
		opacity: 0.6;
		cursor: pointer;
		font-size: 0.95rem;
		font-family: inherit;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: opacity 0.2s, border-color 0.2s;
	}

	.tab-btn:hover {
		opacity: 0.85;
	}

	.tab-btn.active {
		opacity: 1;
		border-bottom-color: var(--color-primary-green);
		color: var(--color-primary-green);
	}

	/* ── Tab Content ── */
	.tab-content {
		max-width: 640px;
	}

	/* ── Verification Banner ── */
	.verify-banner {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 16px;
		margin-bottom: 1.5rem;
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

	/* ── Coming Soon Card ── */
	.account-coming-soon {
		padding: 3rem 2.5rem;
		border-radius: 24px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.account-icon-wrapper {
		width: 64px;
		height: 64px;
		border-radius: 18px;
		background: linear-gradient(135deg, var(--color-primary-green), var(--color-accent-green));
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
	}

	.account-coming-soon h2 {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.account-coming-soon p {
		font-size: 0.95rem;
		opacity: 0.7;
		line-height: 1.7;
		max-width: 400px;
	}

	.account-features-preview {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
	}

	.account-feature-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		opacity: 0.6;
	}

	/* ── Section Card ── */
	.section-card {
		padding: 2rem;
		border-radius: 20px;
	}

	.section-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		color: var(--color-primary-green);
	}

	.section-card-header h2 {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.section-card-desc {
		font-size: 0.9rem;
		opacity: 0.6;
		margin: 0 0 1.5rem;
	}

	/* ── Form ── */
	.section-card :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
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

	/* ── Alerts ── */
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
		margin-bottom: 1rem;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 2rem;
		opacity: 0.6;
		font-size: 0.9rem;
	}

	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.session-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
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
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-glass-border);
	}

	.delete-account-warning {
		display: flex;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 16px;
		margin-bottom: 1.5rem;
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

	/* ── Responsive ── */
	@media (max-width: 640px) {
		.account-hero h1 {
			font-size: 2rem;
		}

		.account-tabs {
			overflow-x: auto;
			gap: 0;
		}

		.tab-btn {
			padding: 0.75rem 1rem;
			font-size: 0.85rem;
			white-space: nowrap;
		}

		.account-features-preview {
			flex-direction: column;
			gap: 1rem;
		}

		.verify-banner {
			flex-direction: column;
			text-align: center;
		}

		.session-card {
			flex-wrap: wrap;
		}
	}
</style>
