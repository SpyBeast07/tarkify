<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft } from '@lucide/svelte';
	import { formatPrice } from '$lib/utils/currency';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';

	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PaymentStatusBadge from '$lib/admin/components/PaymentStatusBadge.svelte';
	import ReceiptCard from '$lib/admin/components/ReceiptCard.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminSectionHeader from '$lib/admin/components/AdminSectionHeader.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	let paymentId = $derived($page.params.id ?? '');

	interface PaymentDetail {
		id: string;
		user_id: string | null;
		guest_email: string | null;
		customer_name: string | null;
		customer_email: string;
		product_id: string;
		product_name: string;
		product_slug: string;
		payment_provider: string;
		razorpay_order_id: string;
		razorpay_payment_id: string | null;
		razorpay_signature: string | null;
		status: string;
		amount: number;
		tax_amount: number;
		total_amount: number;
		currency: string;
		created_at: string;
		updated_at: string;
	}

	interface RefundInfo {
		status: 'refunded' | 'not_refunded';
		refunded_at: string | null;
		refund_amount: number | null;
		refund_reason: string | null;
	}

	interface ReceiptInfo {
		receipt_number: string;
		purchase_date: string;
		amount: number;
		currency: string;
		razorpay_payment_id: string | null;
		razorpay_order_id: string;
		product_name: string;
		customer_email: string;
		customer_name: string | null;
	}

	interface AuditEntry {
		id: string;
		event: string;
		user_id: string | null;
		user_name: string | null;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	let payment = $state<PaymentDetail | null>(null);
	let refund = $state<RefundInfo | null>(null);
	let receipt = $state<ReceiptInfo | null>(null);
	let audit = $state<AuditEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'details' | 'receipt' | 'audit'>('details');

	async function loadPayment() {
		loading = true;
		error = null;
		try {
			const result = await adminFetch<{
				payment: PaymentDetail;
				refund: RefundInfo;
				receipt: ReceiptInfo | null;
				audit: AuditEntry[];
			}>(`/payments/${paymentId}`);
			payment = result.payment;
			refund = result.refund;
			receipt = result.receipt;
			audit = result.audit;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load payment';
			}
		} finally {
			loading = false;
		}
	}

	onMount(loadPayment);

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function failureReason(): string | null {
		if (payment?.status !== 'failed') return null;
		const event = audit.find(e => e.event === 'payment_failed' || e.event === 'failed');
		if (event?.metadata?.gateway_message) return String(event.metadata.gateway_message);
		if (event?.metadata?.reason) return String(event.metadata.reason);
		return 'No failure details recorded.';
	}

	function attemptCount(): number {
		return audit.filter(e => e.event === 'payment_initiated' || e.event === 'payment_attempt').length || 1;
	}
</script>

<svelte:head>
	<title>Payment Detail | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPage {loading} {error} onRetry={loadPayment}>
		{#if payment}
			<AdminPageHeader title={`Payment #${payment.id.substring(0, 8)}`} description={`${payment.payment_provider} · ${formatDate(payment.created_at)}`}>
				<AdminButtonGroup align="right">
					<Button variant="ghost" href="/admin/payments" size="sm" class="btn-with-icon">
						<ArrowLeft size={16} />
						Back to Payments
					</Button>
					<Button variant="ghost" href={`/admin/orders/${payment.id}`} size="sm">
						View Order
					</Button>
				</AdminButtonGroup>
			</AdminPageHeader>

			<div class="tab-bar">
				<button class="tab" class:active={activeTab === 'details'} onclick={() => (activeTab = 'details')}>Details</button>
				<button class="tab" class:active={activeTab === 'receipt'} onclick={() => (activeTab = 'receipt')}>Receipt</button>
				<button class="tab" class:active={activeTab === 'audit'} onclick={() => (activeTab = 'audit')}>Timeline</button>
			</div>

			{#if activeTab === 'details'}
				<AdminGrid cols={{ default: 1, md: 3 }} gap="md">
					<div class="span-two-columns">
						<AdminStack gap="md">
							<AdminCard>
								<AdminSectionHeader title="Payment Information" />
								<div class="detail-list">
									<div class="detail-item">
										<span class="detail-label">Payment ID</span>
										<span class="detail-value mono">{payment.id}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Status</span>
										<span class="detail-value"><PaymentStatusBadge status={payment.status} /></span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Product Price</span>
										<span class="detail-value price">{formatPrice(payment.amount, payment.currency)}</span>
									</div>
									{#if payment.tax_amount > 0}
										<div class="detail-item">
											<span class="detail-label">GST (18%)</span>
											<span class="detail-value price">{formatPrice(payment.tax_amount, payment.currency)}</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">Total Payable</span>
											<span class="detail-value price">{formatPrice(payment.total_amount, payment.currency)}</span>
										</div>
									{:else}
										<div class="detail-item">
											<span class="detail-label">Amount</span>
											<span class="detail-value price">{formatPrice(payment.amount, payment.currency)}</span>
										</div>
									{/if}
									<div class="detail-item">
										<span class="detail-label">Currency</span>
										<span class="detail-value">{payment.currency}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Gateway</span>
										<span class="detail-value">{payment.payment_provider}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Created</span>
										<span class="detail-value">{formatDate(payment.created_at)}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Updated</span>
										<span class="detail-value">{formatDate(payment.updated_at)}</span>
									</div>
								</div>
							</AdminCard>

							<AdminCard>
								<AdminSectionHeader title="Transaction Details" />
								<div class="detail-list">
									<div class="detail-item">
										<span class="detail-label">Razorpay Order ID</span>
										<span class="detail-value mono">{payment.razorpay_order_id}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Razorpay Payment ID</span>
										<span class="detail-value mono">{payment.razorpay_payment_id || '—'}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Signature</span>
										<span class="detail-value mono">{payment.razorpay_signature ? `${payment.razorpay_signature.substring(0, 30)}...` : '—'}</span>
									</div>
								</div>
							</AdminCard>

							{#if payment.status === 'failed'}
								<AdminCard>
									<AdminSectionHeader title="Failure Details" />
									<div class="detail-list">
										<div class="detail-item">
											<span class="detail-label">Failure Reason</span>
											<span class="detail-value">{failureReason() || 'Unknown'}</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">Attempt Count</span>
											<span class="detail-value">{attemptCount()}</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">Retry Possible</span>
											<span class="detail-value">Yes — Customer can retry from the product page.</span>
										</div>
									</div>
								</AdminCard>
							{/if}

							{#if payment.status === 'refunded'}
								<AdminCard>
									<AdminSectionHeader title="Refund Information" />
									<div class="detail-list">
										<div class="detail-item">
											<span class="detail-label">Refund Status</span>
											<span class="detail-value"><PaymentStatusBadge status="refunded" /></span>
										</div>
										<div class="detail-item">
											<span class="detail-label">Refund Amount</span>
											<span class="detail-value price">{refund ? formatPrice(refund.refund_amount ?? payment.amount, payment.currency) : formatPrice(payment.amount, payment.currency)}</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">Refund Date</span>
											<span class="detail-value">{refund?.refunded_at ? formatDate(refund.refunded_at) : formatDate(payment.updated_at)}</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">Refund Reason</span>
											<span class="detail-value">{refund?.refund_reason || 'No reason recorded'}</span>
										</div>
									</div>
									<p class="refund-note">Refunds are managed via Razorpay dashboard. This page shows internal records only.</p>
								</AdminCard>
							{/if}
						</AdminStack>
					</div>

					<AdminStack gap="md">
						<AdminCard>
							<AdminSectionHeader title="Customer" />
							<div class="detail-list">
								<div class="detail-item">
									<span class="detail-label">Name</span>
									<span class="detail-value">{payment.customer_name || 'Guest'}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Email</span>
									<span class="detail-value">{payment.customer_email}</span>
								</div>
							</div>
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="Product" />
							<div class="detail-list">
								<div class="detail-item">
									<span class="detail-label">Name</span>
									<span class="detail-value">{payment.product_name}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Slug</span>
									<span class="detail-value mono">{payment.product_slug}</span>
								</div>
							</div>
						</AdminCard>

						{#if payment.status !== 'paid' && payment.status !== 'refunded'}
							<AdminCard>
								<AdminSectionHeader title="Refund" />
								<p class="empty-text">Not Refunded</p>
								<p class="refund-note">Design for future Razorpay refund API integration.</p>
							</AdminCard>
						{/if}
					</AdminStack>
				</AdminGrid>
			{:else if activeTab === 'receipt'}
				{#if receipt}
					<ReceiptCard {receipt} />
				{:else}
					<AdminSection title="Receipt">
						<AdminEmptyState title="Receipt not available" message="Receipt data could not be loaded for this payment." />
					</AdminSection>
				{/if}
			{:else}
				<AdminSection title="Payment Timeline">
					{#if audit.length === 0}
						<AdminEmptyState title="No events recorded" message="No payment events recorded yet." />
					{:else}
						<AdminTable>
							<thead>
								<tr>
									<th>Event</th>
									<th>User</th>
									<th>Date</th>
								</tr>
							</thead>
							<tbody>
								{#each audit as entry}
									<tr>
										<td>{entry.event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
										<td>{entry.user_name || entry.user_id || 'System'}</td>
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

	.refund-note {
		font-size: 0.8rem;
		opacity: 0.5;
		font-style: italic;
		margin-top: 0.5rem;
		text-align: center;
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
