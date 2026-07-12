<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		ArrowLeft, Download, User, Package,
		History, Shield, RotateCcw, XCircle
	} from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DownloadStatusBadge from '$lib/admin/components/DownloadStatusBadge.svelte';
	import DownloadTokenCard from '$lib/admin/components/DownloadTokenCard.svelte';
	import DownloadHistoryTable from '$lib/admin/components/DownloadHistoryTable.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminDialog from '$lib/admin/components/AdminDialog.svelte';
	import AdminSectionHeader from '$lib/admin/components/AdminSectionHeader.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

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
	let showConfirmDialog = $state(false);

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
		showConfirmDialog = false;
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
		showConfirmDialog = true;
	}

	function cancelConfirm() {
		confirmAction = null;
		showConfirmDialog = false;
	}
</script>

<svelte:head>
	<title>Download Detail | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPage {loading} {error} onRetry={loadDownload}>
		{#if download}
			<AdminPageHeader
				title="Download Token"
				description={`Created ${shortDate(download.created_at)}`}
			>
				<AdminButtonGroup align="right">
					<Button variant="ghost" href="/admin/downloads" size="sm" class="btn-with-icon">
						<ArrowLeft size={16} />
						Back to Downloads
					</Button>
					<Button variant="ghost" href={`/admin/orders/${download.purchase_id}`} size="sm">
						View Order
					</Button>
					{#if download.customer_id}
						<Button variant="ghost" href={`/admin/customers/${download.customer_id}`} size="sm" class="btn-with-icon">
							<User size={16} />
							View Customer
						</Button>
					{/if}
				</AdminButtonGroup>
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
				<AdminGrid cols={{ default: 1, md: 3 }} gap="md">
					<div class="span-two-columns">
						<AdminStack gap="md">
							<AdminCard>
								<AdminSectionHeader title="Overview" />
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
							</AdminCard>

							<AdminCard>
								<AdminSectionHeader title="Customer" />
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
										<Button variant="ghost" size="sm" href={`/admin/customers/${download.customer_id}`} class="btn-with-icon">
											<User size={14} />
											View Customer Profile
										</Button>
									</div>
								{/if}
							</AdminCard>

							<AdminCard>
								<AdminSectionHeader title="Product" />
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
									<Button variant="ghost" size="sm" href={`/admin/products/${download.product_id}`} class="btn-with-icon">
										<Package size={14} />
										View Product
									</Button>
								</div>
							</AdminCard>
						</AdminStack>
					</div>

					<AdminStack gap="md">
						<AdminCard>
							<AdminSectionHeader title="Download Token" />
							<DownloadTokenCard token={download.token} expiresAt={download.expires_at} />
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="Admin Actions" description="Manage this download token. All actions are logged." />
							<AdminButtonGroup align="left">
								<Button
									variant="ghost"
									size="sm"
									class="btn-with-icon"
									disabled={actionLoading !== null || download.status !== 'active'}
									onclick={() => confirmThen('revoke')}
								>
									<XCircle size={14} />
									Revoke Token
								</Button>
								<Button
									variant="ghost"
									size="sm"
									class="btn-with-icon"
									disabled={actionLoading !== null}
									onclick={() => confirmThen('regenerate')}
								>
									<RotateCcw size={14} />
									Regenerate Token
								</Button>
							</AdminButtonGroup>
						</AdminCard>
					</AdminStack>
				</AdminGrid>
			{:else if activeTab === 'history'}
				<AdminSection title="Token History">
					<DownloadHistoryTable entries={history} />
				</AdminSection>
			{:else if activeTab === 'audit'}
				<AdminSection title="Audit Log">
					{#if audit.length === 0}
						<AdminEmptyState title="No audit entries" message="No administrative actions recorded for this token." />
					{:else}
						<AdminTable>
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
						</AdminTable>
					{/if}
				</AdminSection>
			{/if}
		{/if}
	</AdminPage>
</AdminPageContainer>

<AdminDialog
	bind:open={showConfirmDialog}
	title={`Confirm ${confirmAction}`}
	message={confirmAction === 'revoke'
		? 'This will immediately invalidate the current download token. The customer will lose access through this token. Entitlement remains unchanged.'
		: 'This will invalidate the current token and generate a new one using the existing entitlement. The old token will no longer work.'}
	confirmText={actionLoading ? 'Processing...' : 'Confirm'}
	disabled={actionLoading !== null}
	onconfirm={() => confirmAction && performAction(confirmAction)}
	oncancel={cancelConfirm}
	variant={confirmAction === 'revoke' ? 'danger' : 'primary'}
/>

<style>
	.span-two-columns {
		grid-column: span 2;
	}

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
		color: var(--color-text);
	}

	.detail-value.mono {
		font-family: var(--font-accent);
		font-size: 0.85rem;
		opacity: 0.65;
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
		.span-two-columns {
			grid-column: span 1;
		}
	}
</style>
