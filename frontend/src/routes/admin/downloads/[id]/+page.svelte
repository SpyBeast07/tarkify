<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		ArrowLeft, Download, User, Package,
		History, Shield, RotateCcw, XCircle,
		AlertTriangle
	} from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DownloadStatusBadge from '$lib/admin/components/DownloadStatusBadge.svelte';
	import DownloadTokenCard from '$lib/admin/components/DownloadTokenCard.svelte';
	import DownloadHistoryTable from '$lib/admin/components/DownloadHistoryTable.svelte';

	let downloadId = $derived($page.params.id ?? '');

	interface DownloadDetail {
		id: string;
		token: string;
		purchase_id: string;
		product_id: string;
		product_name: string;
		product_slug: string;
		customer_name: string | null;
		customer_email: string;
		customer_id: string | null;
		status: string;
		created_at: string;
		expires_at: string;
		tokens_count: number;
	}

	interface HistoryEntry {
		id: string;
		event: string;
		description: string;
		user_name: string | null;
		created_at: string;
	}

	interface AuditEntry {
		id: string;
		event: string;
		user_id: string | null;
		user_name: string | null;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	let download = $state<DownloadDetail | null>(null);
	let history = $state<HistoryEntry[]>([]);
	let audit = $state<AuditEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'history' | 'audit'>('overview');

	let actionLoading = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let actionSuccess = $state<string | null>(null);
	let confirmAction = $state<string | null>(null);

	let regeneratedToken = $state<{ id: string; token: string; expires_at: string } | null>(null);

	async function loadDownload() {
		loading = true;
		error = null;
		try {
			const result = await adminFetch<{
				download: DownloadDetail;
				history: HistoryEntry[];
				audit: AuditEntry[];
			}>(`/downloads/${downloadId}`);
			download = result.download;
			history = result.history;
			audit = result.audit;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load download';
			}
		} finally {
			loading = false;
		}
	}

	onMount(loadDownload);

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

	async function performAction(action: string) {
		if (!action) return;
		actionLoading = action;
		actionError = null;
		actionSuccess = null;
		confirmAction = null;
		regeneratedToken = null;
		try {
			if (action === 'regenerate') {
				const result = await adminFetch<{ success: boolean; token: { id: string; token: string; expires_at: string } }>(
					`/downloads/${downloadId}/regenerate`,
					{ method: 'POST' }
				);
				if (result.success) {
					regeneratedToken = result.token;
					actionSuccess = 'New token generated successfully.';
					await loadDownload();
				}
			} else {
				const result = await adminFetch<{ success: boolean }>(
					`/downloads/${downloadId}/${action}`,
					{ method: 'POST' }
				);
				if (result.success) {
					actionSuccess = getSuccessMessage(action);
					await loadDownload();
				}
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

	function getSuccessMessage(action: string): string {
		switch (action) {
			case 'revoke': return 'Token revoked successfully. Customer can no longer download using this token.';
			default: return 'Action completed successfully.';
		}
	}

	function confirmThen(action: string) {
		confirmAction = action;
	}

	function cancelConfirm() {
		confirmAction = null;
	}
</script>

<AdminPage {loading} {error} onRetry={loadDownload}>
	{#if download}
		<AdminPageHeader
			title="Download Token"
			description={`Created ${shortDate(download.created_at)}`}
		>
			<Button variant="ghost" href="/admin/downloads">
				<ArrowLeft size={16} />
				Back to Downloads
			</Button>
			<Button variant="ghost" href={`/admin/orders/${download.purchase_id}`}>
				View Order
			</Button>
			{#if download.customer_id}
				<Button variant="ghost" href={`/admin/customers/${download.customer_id}`}>
					<User size={16} />
					View Customer
				</Button>
			{/if}
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

		{#if regeneratedToken}
			<div class="alert alert-success" role="alert">
				<strong>New token generated:</strong>
				<code class="new-token">{regeneratedToken.token}</code>
				(expires {formatDate(regeneratedToken.expires_at)})
			</div>
		{/if}

		<div class="tab-bar">
			<button class="tab" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
			<button class="tab" class:active={activeTab === 'history'} onclick={() => (activeTab = 'history')}>History ({history.length})</button>
			<button class="tab" class:active={activeTab === 'audit'} onclick={() => (activeTab = 'audit')}>Audit</button>
		</div>

		{#if activeTab === 'overview'}
			<div class="detail-grid">
				<div class="detail-column detail-column-left">
					<SectionCard title="Overview" icon={Download}>
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Status</span>
								<span class="detail-value"><DownloadStatusBadge status={download.status} /></span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Created</span>
								<span class="detail-value">{formatDate(download.created_at)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Expires</span>
								<span class="detail-value">{formatDate(download.expires_at)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Total Tokens (Purchase)</span>
								<span class="detail-value">{download.tokens_count}</span>
							</div>
						</div>
					</SectionCard>

					<SectionCard title="Customer" icon={User}>
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Name</span>
								<span class="detail-value">{download.customer_name || 'Guest'}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Email</span>
								<span class="detail-value">{download.customer_email}</span>
							</div>
						</div>
						{#if download.customer_id}
							<div style="margin-top: 0.75rem;">
								<Button variant="ghost" size="sm" href={`/admin/customers/${download.customer_id}`}>
									<User size={14} />
									View Customer Profile
								</Button>
							</div>
						{/if}
					</SectionCard>

					<SectionCard title="Product" icon={Package}>
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Name</span>
								<span class="detail-value">{download.product_name}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Slug</span>
								<span class="detail-value mono">{download.product_slug}</span>
							</div>
						</div>
						<div style="margin-top: 0.75rem;">
							<Button variant="ghost" size="sm" href={`/admin/products/${download.product_id}`}>
								<Package size={14} />
								View Product
							</Button>
						</div>
					</SectionCard>
				</div>

				<div class="detail-column detail-column-right">
					<SectionCard title="Download Token" icon={Shield}>
						<DownloadTokenCard token={download.token} expiresAt={download.expires_at} />
					</SectionCard>

					<SectionCard title="Admin Actions" icon={History}>
						<p class="actions-desc">Manage this download token. All actions are logged.</p>
						<div class="actions-grid">
							<Button
								variant="ghost"
								size="sm"
								disabled={actionLoading !== null || download.status !== 'active'}
								onclick={() => confirmThen('revoke')}
							>
								<XCircle size={14} />
								Revoke Token
							</Button>
							<Button
								variant="ghost"
								size="sm"
								disabled={actionLoading !== null}
								onclick={() => confirmThen('regenerate')}
							>
								<RotateCcw size={14} />
								Regenerate Token
							</Button>
						</div>

						{#if confirmAction}
							<div class="confirm-dialog" role="alertdialog" aria-labelledby="confirm-title">
								<div class="confirm-content">
									<div class="confirm-icon"><AlertTriangle size={20} /></div>
									<h4 id="confirm-title">Confirm {confirmAction}</h4>
									<p>
										{confirmAction === 'revoke'
											? 'This will immediately invalidate the current download token. The customer will lose access through this token. Entitlement remains unchanged.'
											: 'This will invalidate the current token and generate a new one using the existing entitlement. The old token will no longer work.'}
									</p>
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
					</SectionCard>
				</div>
			</div>
		{:else if activeTab === 'history'}
			<AdminSection title="Token History">
				<DownloadHistoryTable entries={history} />
			</AdminSection>
		{:else if activeTab === 'audit'}
			<AdminSection title="Audit Log">
				{#if audit.length === 0}
					<AdminEmptyState title="No audit entries" message="No administrative actions recorded for this token." />
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

	.new-token {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.8rem;
		word-break: break-all;
		opacity: 0.85;
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

	.detail-value.mono {
		font-family: var(--font-accent);
		font-size: 0.85rem;
		opacity: 0.65;
	}

	.actions-desc {
		font-size: 0.8rem;
		opacity: 0.5;
		margin-bottom: 0.75rem;
	}

	.actions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
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

	.event-cell {
		font-weight: 600;
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

	@media (max-width: 900px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
