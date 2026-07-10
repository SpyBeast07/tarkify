<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DollarSign,
		ShoppingCart,
		Users,
		Download,
		Package,
		Plus
	} from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import AdminError from '$lib/admin/components/AdminError.svelte';
	import AdminLoading from '$lib/admin/components/AdminLoading.svelte';
	import DashboardStatCard from '$lib/admin/components/DashboardStatCard.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';

	interface DashboardData {
		summary: {
			revenue: { total: number; paidOrders: number; pendingPayments: number; failedPayments: number };
			orders: { total: number };
			customers: { total: number; verified: number; unverified: number; newThisMonth: number };
			downloads: { total: number; activeTokens: number; expiredTokens: number; today: number };
			products: { published: number; inactive: number; latest: { id: string; name: string; slug: string } | null };
		};
		recentOrders: Array<{ id: string; customer: string | null; email: string | null; product: string; amount: number; status: string; created_at: string }>;
		recentContacts: Array<{ id: string; name: string; subject: string; status: string; created_at: string }>;
		recentFeedback: Array<{ id: string; name: string | null; product: string; rating: number; status: string; created_at: string }>;
		recentCareers: Array<{ id: string; name: string; email: string; status: string; created_at: string }>;
		recentEmails: Array<{ id: string; recipient: string; template: string; status: string; sent_at: string }>;
		recentActivity: Array<{ id: string; event: string; user_id: string | null; user_name: string | null; metadata: Record<string, unknown>; created_at: string }>;
		systemHealth: {
			backend: string; database: string; email: string; payments: string; storage: string; oauth: string;
		};
	}

	let data = $state<DashboardData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadDashboard() {
		loading = true;
		error = null;
		try {
			data = await adminFetch<DashboardData>('/dashboard');
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load dashboard';
			}
		} finally {
			loading = false;
		}
	}

	onMount(loadDashboard);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function statusColor(status: string): string {
		const map: Record<string, string> = {
			paid: 'success',
			created: 'info',
			failed: 'error',
			refunded: 'warning',
			NEW: 'info',
			READ: 'warning',
			REPLIED: 'success',
			ARCHIVED: 'neutral',
			sent: 'success',
			logged: 'neutral',
			skipped: 'warning',
		};
		return map[status] || 'neutral';
	}

	function healthColor(status: string): string {
		if (status === 'healthy') return 'var(--color-accent-green)';
		if (status === 'warning') return '#f59e0b';
		return '#ef4444';
	}

	function systemLabel(key: string): string {
		const labels: Record<string, string> = {
			backend: 'Backend', database: 'Database', email: 'Email',
			payments: 'Payments', storage: 'Storage', oauth: 'OAuth'
		};
		return labels[key] || key;
	}

	function paymentCounts(): { label: string; value: number; status: string }[] {
		if (!data) return [];
		const r = data.summary.revenue;
		return [
			{ label: 'Paid', value: r.paidOrders, status: 'paid' },
			{ label: 'Pending', value: r.pendingPayments, status: 'created' },
			{ label: 'Failed', value: r.failedPayments, status: 'failed' },
		];
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="dashboard-page">
	<AdminPageHeader title="Dashboard" description="Overview of your store.">
		<div class="quick-actions">
			<a href="/admin/products" class="btn btn-outline btn-sm">
				<Plus size={14} aria-hidden="true" /> New Product
			</a>
			<a href="/admin/orders" class="btn btn-outline btn-sm">Orders</a>
			<a href="/admin/customers" class="btn btn-outline btn-sm">Customers</a>
			<a href="/admin/emails" class="btn btn-outline btn-sm">Emails</a>
			<a href="/admin/analytics" class="btn btn-outline btn-sm">Analytics</a>
		</div>
	</AdminPageHeader>

	<AdminPage {loading} {error} onRetry={loadDashboard}>
		{#if data}
			<!-- Summary Cards Row -->
			<section class="summary-grid" aria-label="Key metrics">
				<DashboardStatCard
					label="Revenue"
					value={formatCurrency(data.summary.revenue.total)}
					icon={DollarSign}
					subtext={`${data.summary.revenue.paidOrders} paid orders`}
					href="/admin/orders"
				/>
				<DashboardStatCard
					label="Orders"
					value={data.summary.orders.total}
					icon={ShoppingCart}
					href="/admin/orders"
				/>
				<DashboardStatCard
					label="Customers"
					value={data.summary.customers.total}
					icon={Users}
					subtext={`${data.summary.customers.newThisMonth} new this month`}
					href="/admin/customers"
				/>
				<DashboardStatCard
					label="Downloads"
					value={data.summary.downloads.total}
					icon={Download}
					subtext={`${data.summary.downloads.today} today`}
					href="/admin/downloads"
				/>
				<DashboardStatCard
					label="Products"
					value={data.summary.products.published}
					icon={Package}
					subtext={`${data.summary.products.inactive} inactive`}
					href="/admin/products"
				/>
			</section>

			<!-- Main grid: Revenue + Payment breakdown -->
			<div class="dashboard-grid">
				<div class="grid-left">
					<!-- Revenue Widget -->
					<AdminSection title="Revenue">
						<div class="revenue-main">
							<span class="revenue-total">{formatCurrency(data.summary.revenue.total)}</span>
							<span class="revenue-label">Total Revenue</span>
						</div>
						<div class="revenue-breakdown">
							{#each paymentCounts() as pc}
								<div class="revenue-item">
									<StatusBadge status={pc.status} />
									<span class="revenue-item-label">{pc.label}</span>
									<span class="revenue-item-value">{pc.value}</span>
								</div>
							{/each}
						</div>
					</AdminSection>

					<!-- Recent Orders -->
					<AdminSection title="Recent Orders">
						{#if data.recentOrders.length === 0}
							<AdminEmptyState title="No orders yet" message="Orders will appear here once customers start purchasing." />
						{:else}
							<AdminTableContainer>
								<table aria-label="Recent orders">
									<thead>
										<tr>
											<th>Customer</th>
											<th>Product</th>
											<th>Amount</th>
											<th>Status</th>
											<th>Date</th>
										</tr>
									</thead>
									<tbody>
										{#each data.recentOrders as order}
											<tr
												class="clickable-row"
												onclick={() => window.location.href = `/admin/orders/${order.id}`}
												role="link"
												tabindex="0"
												onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/admin/orders/${order.id}`)}
											>
												<td>{order.customer || order.email || 'Guest'}</td>
												<td>{order.product}</td>
												<td>{formatCurrency(order.amount)}</td>
												<td><StatusBadge status={order.status} /></td>
												<td>{formatDate(order.created_at)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</AdminTableContainer>
						{/if}
					</AdminSection>

					<!-- Recent Contact Messages -->
					<AdminSection title="Recent Messages">
						{#if data.recentContacts.length === 0}
							<AdminEmptyState title="No messages" message="Contact form submissions will appear here." />
						{:else}
							<AdminTableContainer>
								<table aria-label="Recent contact messages">
									<thead>
										<tr>
											<th>Name</th>
											<th>Subject</th>
											<th>Status</th>
											<th>Date</th>
										</tr>
									</thead>
									<tbody>
										{#each data.recentContacts as msg}
											<tr>
												<td>{msg.name}</td>
												<td>{msg.subject}</td>
												<td><StatusBadge status={msg.status.toLowerCase()} /></td>
												<td>{formatDate(msg.created_at)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</AdminTableContainer>
						{/if}
					</AdminSection>

					<!-- Recent Feedback -->
					<AdminSection title="Recent Feedback">
						{#if data.recentFeedback.length === 0}
							<AdminEmptyState title="No feedback yet" message="Customer feedback will appear here." />
						{:else}
							<AdminTableContainer>
								<table aria-label="Recent feedback">
									<thead>
										<tr>
											<th>Customer</th>
											<th>Product</th>
											<th>Rating</th>
											<th>Status</th>
											<th>Date</th>
										</tr>
									</thead>
									<tbody>
										{#each data.recentFeedback as fb}
											<tr>
												<td>{fb.name || 'Anonymous'}</td>
												<td>{fb.product}</td>
												<td>{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</td>
												<td><StatusBadge status={fb.status.toLowerCase()} /></td>
												<td>{formatDate(fb.created_at)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</AdminTableContainer>
						{/if}
					</AdminSection>

					<!-- Recent Careers -->
					<AdminSection title="Recent Applications">
						{#if data.recentCareers.length === 0}
							<AdminEmptyState title="No applications" message="Career applications will appear here." />
						{:else}
							<AdminTableContainer>
								<table aria-label="Recent career applications">
									<thead>
										<tr>
											<th>Applicant</th>
											<th>Email</th>
											<th>Status</th>
											<th>Date</th>
										</tr>
									</thead>
									<tbody>
										{#each data.recentCareers as app}
											<tr>
												<td>{app.name}</td>
												<td>{app.email}</td>
												<td><StatusBadge status={app.status.toLowerCase()} /></td>
												<td>{formatDate(app.created_at)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</AdminTableContainer>
						{/if}
					</AdminSection>

					<!-- Recent Emails -->
					<AdminSection title="Recent Emails">
						{#if data.recentEmails.length === 0}
							<AdminEmptyState title="No emails sent" message="Email logs will appear here." />
						{:else}
							<AdminTableContainer>
								<table aria-label="Recent emails">
									<thead>
										<tr>
											<th>Recipient</th>
											<th>Type</th>
											<th>Status</th>
											<th>Sent</th>
										</tr>
									</thead>
									<tbody>
										{#each data.recentEmails as email}
											<tr>
												<td>{email.recipient}</td>
												<td>{email.template}</td>
												<td><StatusBadge status={email.status} /></td>
												<td>{formatDate(email.sent_at)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</AdminTableContainer>
						{/if}
					</AdminSection>
				</div>

				<div class="grid-right">
					<!-- Customers Widget -->
					<AdminSection title="Customers">
						<div class="customers-grid">
							<div class="customer-stat">
								<span class="customer-value">{data.summary.customers.total}</span>
								<span class="customer-label">Total</span>
							</div>
							<div class="customer-stat">
								<span class="customer-value">{data.summary.customers.verified}</span>
								<span class="customer-label">Verified</span>
							</div>
							<div class="customer-stat">
								<span class="customer-value">{data.summary.customers.unverified}</span>
								<span class="customer-label">Unverified</span>
							</div>
							<div class="customer-stat">
								<span class="customer-value">{data.summary.customers.newThisMonth}</span>
								<span class="customer-label">New This Month</span>
							</div>
						</div>
					</AdminSection>

					<!-- Downloads Widget -->
					<AdminSection title="Downloads">
						<div class="downloads-grid">
							<div class="download-stat">
								<span class="download-value">{data.summary.downloads.total}</span>
								<span class="download-label">Total Tokens</span>
							</div>
							<div class="download-stat active">
								<span class="download-value">{data.summary.downloads.activeTokens}</span>
								<span class="download-label">Active</span>
							</div>
							<div class="download-stat expired">
								<span class="download-value">{data.summary.downloads.expiredTokens}</span>
								<span class="download-label">Expired</span>
							</div>
							<div class="download-stat today">
								<span class="download-value">{data.summary.downloads.today}</span>
								<span class="download-label">Today</span>
							</div>
						</div>
					</AdminSection>

					<!-- Products Widget -->
					<AdminSection title="Products">
						<div class="products-widget">
							<div class="products-stats">
								<div class="product-stat">
									<span class="product-value">{data.summary.products.published}</span>
									<span class="product-label">Published</span>
								</div>
								<div class="product-stat">
									<span class="product-value">{data.summary.products.inactive}</span>
									<span class="product-label">Inactive</span>
								</div>
							</div>
							{#if data.summary.products.latest}
								<div class="latest-product">
									<span class="latest-label">Latest Product</span>
									<a href="/admin/products" class="latest-name">{data.summary.products.latest.name}</a>
								</div>
							{/if}
						</div>
					</AdminSection>

					<!-- System Health -->
					<AdminSection title="System Health">
						<div class="health-grid">
							{#each Object.entries(data.systemHealth) as [key, status]}
								<div class="health-item">
									<span class="health-dot" style="background: {healthColor(status)};" aria-hidden="true"></span>
									<span class="health-label">{systemLabel(key)}</span>
									<span class="health-status" style="color: {healthColor(status)};">{status}</span>
								</div>
							{/each}
						</div>
					</AdminSection>

					<!-- Recent Activity -->
					<AdminSection title="Recent Activity">
						{#if data.recentActivity.length === 0}
							<AdminEmptyState title="No activity" message="Recent actions will appear here." />
						{:else}
							<div class="activity-timeline" role="list" aria-label="Recent activity">
								{#each data.recentActivity as entry}
									<div class="activity-item" role="listitem">
										<div class="activity-dot" aria-hidden="true"></div>
										<div class="activity-content">
											<span class="activity-event">{entry.event.replace(/_/g, ' ')}</span>
											<span class="activity-user">{entry.user_name || 'System'}</span>
											<span class="activity-time">{formatDate(entry.created_at)}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</AdminSection>
				</div>
			</div>
		{/if}
	</AdminPage>
</div>

<style>
	.dashboard-page {
		width: 100%;
	}

	.quick-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 1rem;
		align-items: start;
	}

	.grid-left {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}

	.grid-right {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Recent Orders */
	.clickable-row {
		cursor: pointer;
	}

	.revenue-main {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		margin-bottom: 1rem;
	}

	.revenue-total {
		font-family: var(--font-heading);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary-green);
	}

	.revenue-label {
		font-size: 0.85rem;
		opacity: 0.5;
	}

	.revenue-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.revenue-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.revenue-item-label {
		flex: 1;
		opacity: 0.6;
	}

	.revenue-item-value {
		font-weight: 600;
		min-width: 2rem;
		text-align: right;
	}

	/* Customers */
	.customers-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.customer-stat {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.customer-value {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-primary-green);
	}

	.customer-label {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	/* Downloads */
	.downloads-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.download-stat {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.download-stat .download-value {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-primary-green);
	}

	.download-stat.active .download-value { color: #22c55e; }
	.download-stat.expired .download-value { color: #ef4444; }
	.download-stat.today .download-value { color: var(--color-accent-green); }

	.download-label {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	/* Products */
	.products-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.product-stat {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.product-value {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-primary-green);
	}

	.product-label {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.latest-product {
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-glass-border);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.latest-label {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.latest-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-accent-green);
		text-decoration: none;
	}

	.latest-name:hover {
		text-decoration: underline;
	}

	/* System Health */
	.health-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.health-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.health-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.health-label {
		flex: 1;
		opacity: 0.6;
		font-weight: 500;
	}

	.health-status {
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: capitalize;
	}

	/* Activity Timeline */
	.activity-timeline {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.activity-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.625rem 0;
		border-bottom: 1px solid var(--color-glass-border);
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-accent-green);
		margin-top: 0.375rem;
		flex-shrink: 0;
	}

	.activity-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.activity-event {
		font-size: 0.85rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.activity-user {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.activity-time {
		font-size: 0.7rem;
		opacity: 0.35;
	}

	@media (max-width: 1024px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.grid-right {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 768px) {
		.summary-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		}

		.grid-right {
			grid-template-columns: 1fr;
		}

		.quick-actions {
			width: 100%;
		}

		.quick-actions :global(.btn) {
			flex: 1;
			min-width: 0;
		}
	}
</style>
