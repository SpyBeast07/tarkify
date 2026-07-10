<script lang="ts" module>
	const CONFIRM_MESSAGES: Record<string, (email: string) => string> = {
		suspend: (email: string) => `Are you sure you want to suspend ${email}? They will not be able to log in or make purchases until reactivated.`,
		reactivate: (email: string) => `Are you sure you want to reactivate ${email}? They will regain access to their account.`,
		delete: (email: string) => `Are you sure you want to soft-delete ${email}? The account will be disabled but data will be retained for compliance. This action can potentially be reversed.`,
		'resend-verification': (email: string) => `Send a new verification email to ${email}?`,
		'reset-password': (email: string) => `Send a password reset email to ${email}?`,
		'revoke-sessions': (email: string) => `Terminate all active sessions for ${email}? They will be logged out of all devices.`,
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		ArrowLeft, User, Shield, ShoppingCart, Download, Monitor,
		Link, History, Activity, AlertTriangle, Mail,
		Lock, LogOut, Trash2, RotateCcw, XCircle
	} from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CustomerStatusBadge from '$lib/admin/components/CustomerStatusBadge.svelte';
	import SessionTable from '$lib/admin/components/SessionTable.svelte';
	import CustomerOverviewCard from '$lib/admin/components/CustomerOverviewCard.svelte';
	import ActivityTimeline from '$lib/admin/components/ActivityTimeline.svelte';

	let customerId = $derived($page.params.id ?? '');

	interface CustomerDetail {
		id: string;
		email: string;
		name: string | null;
		display_name: string | null;
		image: string | null;
		timezone: string | null;
		preferences: Record<string, unknown>;
		role: string;
		account_status: string;
		email_verified: boolean;
		last_login_at: string | null;
		last_activity_at: string | null;
		created_at: string;
		updated_at: string;
		has_password: boolean;
		oauth_accounts: { provider_id: string; account_id: string; created_at: string }[];
	}

	interface CustomerPurchase {
		id: string;
		product_name: string;
		product_slug: string;
		amount: number;
		currency: string;
		status: string;
		created_at: string;
	}

	interface CustomerDownload {
		id: string;
		token: string;
		purchase_id: string;
		product_name: string;
		expires_at: string;
		created_at: string;
	}

	interface CustomerSession {
		id: string;
		user_id: string;
		token: string;
		ip_address: string | null;
		user_agent: string | null;
		device_name: string | null;
		device_type: string | null;
		browser: string | null;
		os: string | null;
		created_at: string;
		expires_at: string;
		last_seen: string | null;
		is_current: boolean;
	}

	interface AuditEntry {
		id: string;
		event: string;
		user_id: string | null;
		user_name: string | null;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	interface ActivityEntry {
		id: string;
		event: string;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	let customer = $state<CustomerDetail | null>(null);
	let purchases = $state<CustomerPurchase[]>([]);
	let downloads = $state<CustomerDownload[]>([]);
	let sessions = $state<CustomerSession[]>([]);
	let activity = $state<ActivityEntry[]>([]);
	let audit = $state<AuditEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'purchases' | 'downloads' | 'sessions' | 'activity' | 'audit'>('overview');

	let actionLoading = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let actionSuccess = $state<string | null>(null);

	let confirmAction = $state<string | null>(null);

	async function loadCustomer() {
		loading = true;
		error = null;
		try {
			const result = await adminFetch<{
				customer: CustomerDetail;
				purchases: CustomerPurchase[];
				downloads: CustomerDownload[];
				sessions: CustomerSession[];
				activity: ActivityEntry[];
				audit: AuditEntry[];
			}>(`/customers/${customerId}`);
			customer = result.customer;
			purchases = result.purchases;
			downloads = result.downloads;
			sessions = result.sessions.map(s => ({
				...s,
				is_current: s.id === customer?.id ? false : false
			}));
			activity = result.activity;
			audit = result.audit;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load customer';
			}
		} finally {
			loading = false;
		}
	}

	onMount(loadCustomer);

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function shortDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatPrice(price: number, currency: string): string {
		try {
			return new Intl.NumberFormat('en-IN', {
				style: 'currency',
				currency: currency || 'INR',
				maximumFractionDigits: 0
			}).format(price / 100);
		} catch {
			return `${currency} ${price}`;
		}
	}

	function tokenStatus(token: CustomerDownload): string {
		const now = new Date();
		const expires = new Date(token.expires_at);
		return expires > now ? 'Active' : 'Expired';
	}

	async function performAction(action: string) {
		if (!action) return;
		actionLoading = action;
		actionError = null;
		actionSuccess = null;
		confirmAction = null;
		try {
			const result = await adminFetch<{ success: boolean; result?: number }>(`/customers/${customerId}/${action}`, {
				method: 'POST',
			});
			if (result.success) {
				actionSuccess = getSuccessMessage(action, result.result);
				await loadCustomer();
			}
		} catch (err) {
			if (err instanceof AdminApiError) {
				actionError = err.message;
			} else {
				actionError = `Failed to ${action.replace(/-/g, ' ')}`;
			}
		} finally {
			actionLoading = null;
		}
	}

	function getSuccessMessage(action: string, result?: number): string {
		switch (action) {
			case 'suspend': return 'Customer suspended successfully.';
			case 'reactivate': return 'Customer reactivated successfully.';
			case 'delete': return 'Customer deleted (soft delete). Their data remains accessible for compliance.';
			case 'resend-verification': return 'Verification email sent.';
			case 'reset-password': return 'Password reset email sent.';
			case 'revoke-sessions': return `${result || ''} session(s) revoked.`.trim();
			default: return 'Action completed successfully.';
		}
	}

	function confirmThen(action: string) {
		confirmAction = action;
	}

	function cancelConfirm() {
		confirmAction = null;
	}

	function isDangerousAction(action: string): boolean {
		return ['suspend', 'delete', 'revoke-sessions'].includes(action);
	}
</script>

<AdminPage {loading} {error} onRetry={loadCustomer}>
	{#if customer}
		<AdminPageHeader
			title={customer.display_name || customer.name || customer.email}
			description={`Customer since ${shortDate(customer.created_at)}`}
		>
			<Button variant="ghost" href="/admin/customers">
				<ArrowLeft size={16} />
				Back to Customers
			</Button>
		</AdminPageHeader>

		{#if actionSuccess}
			<div class="alert alert-success" role="alert">
				{actionSuccess}
			</div>
		{/if}
		{#if actionError}
			<div class="alert alert-error" role="alert">
				{actionError}
			</div>
		{/if}

		<div class="tab-bar">
			<button class="tab" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
			<button class="tab" class:active={activeTab === 'purchases'} onclick={() => (activeTab = 'purchases')}>Purchases ({purchases.length})</button>
			<button class="tab" class:active={activeTab === 'downloads'} onclick={() => (activeTab = 'downloads')}>Downloads ({downloads.length})</button>
			<button class="tab" class:active={activeTab === 'sessions'} onclick={() => (activeTab = 'sessions')}>Sessions ({sessions.length})</button>
			<button class="tab" class:active={activeTab === 'activity'} onclick={() => (activeTab = 'activity')}>Activity</button>
			<button class="tab" class:active={activeTab === 'audit'} onclick={() => (activeTab = 'audit')}>Audit History</button>
		</div>

		{#if activeTab === 'overview'}
			<div class="detail-grid">
				<div class="detail-column detail-column-left">
					<SectionCard title="Profile" icon={User}>
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Name</span>
								<span class="detail-value">{customer.name || '—'}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Display Name</span>
								<span class="detail-value">{customer.display_name || '—'}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Email</span>
								<span class="detail-value">{customer.email}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Timezone</span>
								<span class="detail-value">{customer.timezone || 'UTC'}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Created</span>
								<span class="detail-value">{formatDate(customer.created_at)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Updated</span>
								<span class="detail-value">{formatDate(customer.updated_at)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Last Login</span>
								<span class="detail-value">{formatDate(customer.last_login_at)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Last Activity</span>
								<span class="detail-value">{formatDate(customer.last_activity_at)}</span>
							</div>
						</div>
					</SectionCard>

					<SectionCard title="Account" icon={Shield}>
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Account Status</span>
								<span class="detail-value"><CustomerStatusBadge status={customer.account_status} /></span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Email Verified</span>
								<span class="detail-value">{customer.email_verified ? 'Yes' : 'No'}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Authentication</span>
								<span class="detail-value">
									{customer.oauth_accounts.filter(a => a.provider_id !== 'credential').map(a => a.provider_id).join(', ') || 'Email & Password'}
								</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Has Password</span>
								<span class="detail-value">{customer.has_password ? 'Yes' : 'No'}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Role</span>
								<span class="detail-value">{customer.role}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Member Since</span>
								<span class="detail-value">{shortDate(customer.created_at)}</span>
							</div>
						</div>
					</SectionCard>

					<SectionCard title="OAuth Accounts" icon={Link}>
						{#if customer.oauth_accounts.length === 0}
							<p class="empty-text">No OAuth accounts linked.</p>
						{:else}
							<AdminTableContainer>
								<table>
									<thead>
										<tr>
											<th>Provider</th>
											<th>Account ID</th>
											<th>Linked Since</th>
										</tr>
									</thead>
									<tbody>
										{#each customer.oauth_accounts as oa}
											<tr>
												<td class="provider-cell">{oa.provider_id}</td>
												<td class="mono-small">{oa.account_id.substring(0, 16)}...</td>
												<td class="date-cell">{shortDate(oa.created_at)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</AdminTableContainer>
						{/if}
					</SectionCard>

					<div class="admin-actions-section">
						<h3 class="actions-title">Admin Actions</h3>
						<p class="actions-desc">Perform administrative actions on this customer account. All actions are logged.</p>

						<div class="actions-grid">
							{#if customer.email_verified}
								<Button variant="ghost" size="sm" disabled title="Email already verified">
									<Mail size={14} />
									Resend Verification
								</Button>
							{:else}
								<Button
									variant="ghost"
									size="sm"
									disabled={actionLoading !== null}
									onclick={() => confirmThen('resend-verification')}
								>
									<Mail size={14} />
									Resend Verification
								</Button>
							{/if}

							<Button
								variant="ghost"
								size="sm"
								disabled={actionLoading !== null}
								onclick={() => confirmThen('reset-password')}
							>
								<Lock size={14} />
								Send Password Reset
							</Button>

							{#if customer.account_status === 'ACTIVE'}
								<Button
									variant="ghost"
									size="sm"
									disabled={actionLoading !== null}
									onclick={() => confirmThen('suspend')}
								>
									<XCircle size={14} />
									Suspend
								</Button>
							{:else if customer.account_status === 'SUSPENDED'}
								<Button
									variant="ghost"
									size="sm"
									disabled={actionLoading !== null}
									onclick={() => confirmThen('reactivate')}
								>
									<RotateCcw size={14} />
									Reactivate
								</Button>
							{/if}

							<Button
								variant="ghost"
								size="sm"
								disabled={actionLoading !== null}
								onclick={() => confirmThen('revoke-sessions')}
							>
								<LogOut size={14} />
								Terminate Sessions
							</Button>

							{#if customer.account_status !== 'DELETED'}
								<Button
									variant="ghost"
									size="sm"
									class="danger-btn"
									disabled={actionLoading !== null}
									onclick={() => confirmThen('delete')}
								>
									<Trash2 size={14} />
									Delete Account
								</Button>
							{/if}
						</div>

						{#if confirmAction}
							<div class="confirm-dialog" role="alertdialog" aria-labelledby="confirm-title">
								<div class="confirm-content">
									{#if isDangerousAction(confirmAction)}
										<div class="confirm-icon"><AlertTriangle size={20} /></div>
									{/if}
									<h4 id="confirm-title">Confirm {confirmAction.replace(/-/g, ' ')}</h4>
									<p>{CONFIRM_MESSAGES[confirmAction]?.(customer.email) || 'Are you sure?'}</p>
									<div class="confirm-buttons">
										<Button
											variant="primary"
											size="sm"
											disabled={actionLoading === confirmAction}
											onclick={() => confirmAction && performAction(confirmAction)}
										>
											{actionLoading === confirmAction ? 'Processing...' : 'Confirm'}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											disabled={actionLoading !== null}
											onclick={cancelConfirm}
										>
											Cancel
										</Button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="detail-column detail-column-right">
					<SectionCard title="Recent Activity" icon={Activity}>
						{#if activity.length === 0}
							<p class="empty-text">No recent activity recorded.</p>
						{:else}
							<ActivityTimeline entries={activity.slice(0, 10)} />
						{/if}
					</SectionCard>
				</div>
			</div>
		{:else if activeTab === 'purchases'}
			<AdminSection title="Purchases">
				{#if purchases.length === 0}
					<AdminEmptyState title="No purchases" message="This customer has not made any purchases yet." />
				{:else}
					<AdminTableContainer>
						<table>
							<thead>
								<tr>
									<th>Product</th>
									<th>Amount</th>
									<th>Status</th>
									<th>Purchased</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each purchases as purchase}
									<tr>
										<td>{purchase.product_name}</td>
										<td class="amount-cell">{formatPrice(purchase.amount, purchase.currency)}</td>
										<td>{purchase.status}</td>
										<td class="date-cell">{shortDate(purchase.created_at)}</td>
										<td>
											<Button variant="ghost" size="sm" href={`/admin/orders/${purchase.id}`}>
												View Order
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</AdminTableContainer>
				{/if}
			</AdminSection>
		{:else if activeTab === 'downloads'}
			<AdminSection title="Downloads">
				{#if downloads.length === 0}
					<AdminEmptyState title="No downloads" message="This customer has no download records." />
				{:else}
					<AdminTableContainer>
						<table>
							<thead>
								<tr>
									<th>Product</th>
									<th>Token</th>
									<th>Created</th>
									<th>Expires</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{#each downloads as dl}
									<tr>
										<td>{dl.product_name}</td>
										<td class="mono-small">{dl.token.substring(0, 16)}...</td>
										<td class="date-cell">{shortDate(dl.created_at)}</td>
										<td class="date-cell">{shortDate(dl.expires_at)}</td>
										<td>{tokenStatus(dl)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</AdminTableContainer>
				{/if}
			</AdminSection>
		{:else if activeTab === 'sessions'}
			<AdminSection title="Sessions">
				<div class="section-actions">
					<Button
						variant="ghost"
						size="sm"
						disabled={actionLoading !== null}
						onclick={() => confirmThen('revoke-sessions')}
					>
						<LogOut size={14} />
						Terminate All Sessions
					</Button>
				</div>
				{#if sessions.length === 0}
					<AdminEmptyState title="No active sessions" message="This customer has no active sessions." />
				{:else}
					<SessionTable sessions={sessions} />
				{/if}
			</AdminSection>
		{:else if activeTab === 'activity'}
			<AdminSection title="Recent Activity">
				{#if activity.length === 0}
					<AdminEmptyState title="No activity" message="No activity recorded for this customer." />
				{:else}
					<ActivityTimeline entries={activity} />
				{/if}
			</AdminSection>
		{:else if activeTab === 'audit'}
			<AdminSection title="Audit History">
				{#if audit.length === 0}
					<AdminEmptyState title="No audit entries" message="No administrative actions recorded for this customer." />
				{:else}
					<AdminTableContainer>
						<table>
							<thead>
								<tr>
									<th>Event</th>
									<th>Admin</th>
									<th>Details</th>
									<th>Date</th>
								</tr>
							</thead>
							<tbody>
								{#each audit as entry}
									<tr>
										<td class="event-cell">{entry.event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
										<td>{entry.user_name || entry.user_id?.substring(0, 8) || 'System'}</td>
										<td class="mono-small">{JSON.stringify(entry.metadata).substring(0, 60)}</td>
										<td class="date-cell">{formatDate(entry.created_at)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</AdminTableContainer>
				{/if}
			</AdminSection>
		{/if}
	{/if}
</AdminPage>

<style>
	.tab-bar {
		display: flex;
		gap: 0;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-glass-border);
		overflow-x: auto;
	}

	.tab {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		opacity: 0.55;
		color: var(--color-text);
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.tab:hover {
		opacity: 0.8;
	}

	.tab.active {
		opacity: 1;
		border-bottom-color: var(--color-accent-green);
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.alert-success {
		background: rgba(39, 59, 9, 0.12);
		color: #5a7a1a;
		border: 1px solid rgba(39, 59, 9, 0.2);
	}

	.alert-error {
		background: rgba(220, 38, 38, 0.1);
		color: #ef4444;
		border: 1px solid rgba(220, 38, 38, 0.2);
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 1.5rem;
		align-items: start;
	}

	.detail-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detail-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.detail-label {
		font-size: 0.8rem;
		opacity: 0.5;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.detail-value {
		font-size: 0.95rem;
		line-height: 1.5;
		word-break: break-word;
	}

	.empty-text {
		font-size: 0.85rem;
		opacity: 0.5;
		text-align: center;
		padding: 1rem 0;
	}

	.mono-small {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.date-cell {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.amount-cell {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.provider-cell {
		font-weight: 600;
		text-transform: capitalize;
	}

	.admin-actions-section {
		margin-top: 0.5rem;
	}

	.actions-title {
		font-size: 0.95rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.actions-desc {
		font-size: 0.8rem;
		opacity: 0.5;
		margin-bottom: 1rem;
	}

	.actions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.danger-btn {
		color: #ef4444;
	}

	.danger-btn:hover {
		background: rgba(220, 38, 38, 0.1) !important;
	}

	.confirm-dialog {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: rgba(220, 38, 38, 0.06);
		border: 1px solid rgba(220, 38, 38, 0.15);
	}

	.confirm-content {
		text-align: center;
	}

	.confirm-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 0.75rem;
		opacity: 0.6;
	}

	.confirm-content h4 {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		text-transform: capitalize;
	}

	.confirm-content p {
		font-size: 0.85rem;
		opacity: 0.7;
		margin-bottom: 1rem;
	}

	.confirm-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.section-actions {
		margin-bottom: 1rem;
	}

	.event-cell {
		font-weight: 600;
	}

	@media (max-width: 900px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
