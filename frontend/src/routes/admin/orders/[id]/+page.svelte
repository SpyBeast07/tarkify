<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, CreditCard } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import OrderStatusBadge from '$lib/admin/components/OrderStatusBadge.svelte';
	import PaymentTimeline from '$lib/admin/components/PaymentTimeline.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminSectionHeader from '$lib/admin/components/AdminSectionHeader.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	let orderId = $derived($page.params.id ?? '');

	interface OrderDetail {
		id: string;
		user_id: string | null;
		guest_email: string | null;
		customer_name: string | null;
		customer_email: string;
		product_id: string;
		product_name: string;
		product_slug: string;
		product_description: string | null;
		payment_provider: string;
		razorpay_order_id: string;
		razorpay_payment_id: string | null;
		razorpay_signature: string | null;
		status: string;
		amount: number;
		currency: string;
		created_at: string;
		updated_at: string;
	}

	interface Entitlement {
		id: string;
		user_id: string | null;
		guest_email: string | null;
		product_id: string;
		purchase_id: string;
		granted_at: string;
		revoked_at: string | null;
	}

	interface DownloadToken {
		id: string;
		token: string;
		purchase_id: string;
		product_id: string;
		expires_at: string;
		created_at: string;
	}

	interface EmailLog {
		id: string;
		recipient: string;
		template: string;
		provider: string;
		status: string;
		error: string | null;
		sent_at: string;
		metadata: Record<string, unknown>;
	}

	interface AuditEntry {
		id: string;
		event: string;
		user_id: string | null;
		user_name: string | null;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	let order = $state<OrderDetail | null>(null);
	let entitlements = $state<Entitlement[]>([]);
	let downloadTokens = $state<DownloadToken[]>([]);
	let emailLogs = $state<EmailLog[]>([]);
	let audit = $state<AuditEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'audit'>('overview');

	async function loadOrder() {
		loading = true;
		error = null;
		try {
			const result = await adminFetch<{
				order: OrderDetail;
				entitlements: Entitlement[];
				downloadTokens: DownloadToken[];
				emailLogs: EmailLog[];
				audit: AuditEntry[];
			}>(`/orders/${orderId}`);
			order = result.order;
			entitlements = result.entitlements;
			downloadTokens = result.downloadTokens;
			emailLogs = result.emailLogs;
			audit = result.audit;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load order';
			}
		} finally {
			loading = false;
		}
	}

	onMount(loadOrder);

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

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function tokenStatus(token: DownloadToken): string {
		const now = new Date();
		const expires = new Date(token.expires_at);
		return expires > now ? 'Active' : 'Expired';
	}
</script>

<svelte:head>
	<title>Order Detail | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPage {loading} {error} onRetry={loadOrder}>
		{#if order}
			<AdminPageHeader title={`Order #${order.id.substring(0, 8)}`} description={`Placed on ${formatDate(order.created_at)}`}>
				<AdminButtonGroup align="right">
					<Button variant="ghost" href="/admin/orders" size="sm" class="btn-with-icon">
						<ArrowLeft size={16} />
						Back to Orders
					</Button>
					<Button variant="ghost" href={`/admin/payments/${order.id}`} size="sm" class="btn-with-icon">
						<CreditCard size={16} />
						View Payment
					</Button>
				</AdminButtonGroup>
			</AdminPageHeader>

			<div class="tab-bar">
				<button class="tab" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
				<button class="tab" class:active={activeTab === 'audit'} onclick={() => (activeTab = 'audit')}>Audit Timeline</button>
			</div>

			{#if activeTab === 'overview'}
				<AdminGrid cols={{ default: 1, md: 3 }} gap="md">
					<div class="span-two-columns">
						<AdminStack gap="md">
							<AdminCard>
								<AdminSectionHeader title="Order Information" />
								<div class="detail-list">
									<div class="detail-item">
										<span class="detail-label">Order ID</span>
										<span class="detail-value mono">{order.id}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Status</span>
										<span class="detail-value"><OrderStatusBadge status={order.status} /></span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Created</span>
										<span class="detail-value">{formatDate(order.created_at)}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Updated</span>
										<span class="detail-value">{formatDate(order.updated_at)}</span>
									</div>
								</div>
							</AdminCard>

							<AdminCard>
								<AdminSectionHeader title="Customer Information" />
								<div class="detail-list">
									<div class="detail-item">
										<span class="detail-label">Name</span>
										<span class="detail-value">{order.customer_name || 'Guest'}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Email</span>
										<span class="detail-value">{order.customer_email}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">User ID</span>
										<span class="detail-value mono">{order.user_id || '—'}</span>
									</div>
								</div>
							</AdminCard>

							<AdminCard>
								<AdminSectionHeader title="Product" />
								<div class="detail-list">
									<div class="detail-item">
										<span class="detail-label">Name</span>
										<span class="detail-value">{order.product_name}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Slug</span>
										<span class="detail-value mono">{order.product_slug}</span>
									</div>
								</div>
							</AdminCard>

							<AdminCard>
								<AdminSectionHeader title="Payment Information" />
								<div class="detail-list">
									<div class="detail-item">
										<span class="detail-label">Amount</span>
										<span class="detail-value price">{formatPrice(order.amount, order.currency)}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Currency</span>
										<span class="detail-value">{order.currency}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Gateway</span>
										<span class="detail-value">{order.payment_provider}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Razorpay Order ID</span>
										<span class="detail-value mono">{order.razorpay_order_id}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Razorpay Payment ID</span>
										<span class="detail-value mono">{order.razorpay_payment_id || '—'}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Signature</span>
										<span class="detail-value mono">{order.razorpay_signature ? `${order.razorpay_signature.substring(0, 20)}...` : '—'}</span>
									</div>
								</div>
							</AdminCard>
						</AdminStack>
					</div>

					<AdminStack gap="md">
						<AdminCard>
							<AdminSectionHeader title="Download Tokens" />
							{#if downloadTokens.length === 0}
								<p class="empty-text">No download tokens generated yet.</p>
							{:else}
								<AdminTable>
									<thead>
										<tr>
											<th>Token</th>
											<th>Expires</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{#each downloadTokens as dt}
											<tr>
												<td class="mono-small">{dt.token.substring(0, 16)}...</td>
												<td class="date-cell">{formatDate(dt.expires_at)}</td>
												<td><OrderStatusBadge status={tokenStatus(dt)} /></td>
											</tr>
										{/each}
									</tbody>
								</AdminTable>
							{/if}
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="Entitlements" />
							{#if entitlements.length === 0}
								<p class="empty-text">No entitlements granted yet.</p>
							{:else}
								<AdminTable>
									<thead>
										<tr>
											<th>Granted</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{#each entitlements as ent}
											<tr>
												<td class="date-cell">{formatDate(ent.granted_at)}</td>
												<td><OrderStatusBadge status={ent.revoked_at ? 'revoked' : 'active'} /></td>
											</tr>
										{/each}
									</tbody>
								</AdminTable>
							{/if}
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="Emails Sent" />
							{#if emailLogs.length === 0}
								<p class="empty-text">No emails recorded for this order.</p>
							{:else}
								<AdminTable>
									<thead>
										<tr>
											<th>Template</th>
											<th>Status</th>
											<th>Sent</th>
										</tr>
									</thead>
									<tbody>
										{#each emailLogs as log}
											<tr>
												<td>{log.template}</td>
												<td><OrderStatusBadge status={log.status} /></td>
												<td class="date-cell">{formatDate(log.sent_at)}</td>
											</tr>
										{/each}
									</tbody>
								</AdminTable>
							{/if}
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="Internal Notes" />
							<p class="empty-text">Internal notes are read-only at this stage. Future updates will allow adding notes.</p>
						</AdminCard>
					</AdminStack>
				</AdminGrid>
			{:else}
				<AdminSection title="Audit Timeline">
					{#if audit.length === 0}
						<AdminEmptyState title="No audit entries" message="No activity recorded for this order." />
					{:else}
						<PaymentTimeline entries={audit} />
					{/if}
				</AdminSection>
			{/if}
		{/if}
	</AdminPage>
</AdminPageContainer>

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

	.detail-value.price {
		font-size: 1.2rem;
		font-weight: 700;
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

	@media (max-width: 900px) {
		.span-two-columns {
			grid-column: span 1;
		}
	}
</style>
