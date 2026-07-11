<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ShoppingCart,
		Users,
		Download,
		Package,
		Plus,
		IndianRupee,
		Mail,
		Percent,
		Receipt,
	} from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import {
		type AnalyticsQuery,
		type AnalyticsRange,
		getOverview,
		getRevenue,
		getOrders,
		getDownloads,
		getProducts,
		getCustomers,
		getEmails,
		getGrowth,
		getTraffic,
	} from '$lib/admin/api/analytics';
	import type {
		AnalyticsOverview,
		RevenueAnalytics,
		OrdersAnalytics,
		DownloadsAnalytics,
		ProductsAnalytics,
		CustomersAnalytics,
		EmailsAnalytics,
		TrafficAnalytics,
		GrowthAnalytics,
	} from '$lib/admin/types/analytics';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import DashboardStatCard from '$lib/admin/components/DashboardStatCard.svelte';
	import EmailStatsCard from '$lib/admin/components/EmailStatsCard.svelte';
	import AnalyticsChart from '$lib/admin/components/AnalyticsChart.svelte';
	import AnalyticsFilterBar from '$lib/admin/components/AnalyticsFilterBar.svelte';
	import AnalyticsComparisonCard from '$lib/admin/components/AnalyticsComparisonCard.svelte';

	interface DashboardData {
		summary: {
			revenue: { total: number; paidOrders: number; pendingPayments: number; failedPayments: number };
			orders: { total: number };
			customers: { total: number; verified: number; unverified: number; newThisMonth: number };
			downloads: { total: number; activeTokens: number; expiredTokens: number; today: number };
			products: { published: number; inactive: number; latest: { id: string; name: string; slug: string } | null };
		};
		systemHealth: {
			backend: string; database: string; email: string; payments: string; storage: string; oauth: string;
		};
	}

	let data = $state<DashboardData | null>(null);
	let dashLoading = $state(true);
	let dashError = $state<string | null>(null);

	let range = $state<AnalyticsRange>('month');
	let start = $state('');
	let end = $state('');
	let analyticsLoading = $state(true);
	let analyticsError = $state<string | null>(null);

	let overview = $state<AnalyticsOverview | null>(null);
	let revenue = $state<RevenueAnalytics | null>(null);
	let orders = $state<OrdersAnalytics | null>(null);
	let downloads = $state<DownloadsAnalytics | null>(null);
	let products = $state<ProductsAnalytics | null>(null);
	let customers = $state<CustomersAnalytics | null>(null);
	let emails = $state<EmailsAnalytics | null>(null);
	let growth = $state<GrowthAnalytics | null>(null);
	let traffic = $state<TrafficAnalytics | null>(null);

	let pageLoading = $derived(dashLoading || (!data && analyticsLoading));

	async function loadDashboard() {
		dashLoading = true;
		dashError = null;
		try {
			data = await adminFetch<DashboardData>('/dashboard');
		} catch (err) {
			dashError = err instanceof AdminApiError ? err.message : 'Failed to load dashboard';
		} finally {
			dashLoading = false;
		}
	}

	function query(): AnalyticsQuery {
		return { range, start, end };
	}

	async function loadAnalytics() {
		analyticsLoading = true;
		analyticsError = null;
		try {
			const [o, r, ord, dl, pr, cu, em, gr, tr] = await Promise.all([
				getOverview(query()),
				getRevenue(query()),
				getOrders(query()),
				getDownloads(query()),
				getProducts(query()),
				getCustomers(query()),
				getEmails(query()),
				getGrowth(query()),
				getTraffic(query()),
			]);
			overview = o;
			revenue = r;
			orders = ord;
			downloads = dl;
			products = pr;
			customers = cu;
			emails = em;
			growth = gr;
			traffic = tr;
		} catch (err) {
			analyticsError = err instanceof AdminApiError ? err.message : 'Failed to load analytics';
		} finally {
			analyticsLoading = false;
		}
	}

	onMount(() => {
		Promise.all([loadDashboard(), loadAnalytics()]);
	});

	function onRangeChange(next: { range: AnalyticsRange; start: string; end: string }) {
		range = next.range;
		start = next.start;
		end = next.end;
		loadAnalytics();
	}

	function handleRetry() {
		Promise.all([loadDashboard(), loadAnalytics()]);
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
	}

	const fmtNumber = (n: number) => n.toLocaleString('en-IN');
	const fmtPercent = (n: number) => `${n}%`;

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

	function toChart(data: { date: string; value: number }[]) {
		return data.map((p) => ({ label: p.date, value: p.value }));
	}
	function toNamed(items: { product: string; orders?: number; downloads?: number; count?: number }[]) {
		return items.map((i) => ({ label: i.product || '—', value: i.orders ?? i.downloads ?? i.count ?? 0 }));
	}
	function emailTypeChart(items: { type: string; count: number }[]) {
		return items.map((i) => ({ label: i.type || 'other', value: i.count }));
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="dashboard-page">
	<AdminPageHeader title="Dashboard" description="Business overview with key metrics, analytics, and recent activity.">
		<div class="quick-actions">
			<a href="/admin/products" class="btn btn-outline btn-sm">
				<Plus size={14} aria-hidden="true" /> New Product
			</a>
			<a href="/admin/orders" class="btn btn-outline btn-sm">Orders</a>
			<a href="/admin/customers" class="btn btn-outline btn-sm">Customers</a>
			<a href="/admin/emails" class="btn btn-outline btn-sm">Emails</a>
		</div>
	</AdminPageHeader>

	<AdminPage loading={pageLoading} error={dashError} onRetry={handleRetry}>
		{#if data}
			<AnalyticsFilterBar {range} {start} {end} onchange={onRangeChange} disabled={analyticsLoading} />

			{#if analyticsError}
				<div class="alert alert-error analytics-error" role="alert">
					{analyticsError}
					<button class="btn btn-ghost btn-sm" onclick={() => loadAnalytics()}>Retry</button>
				</div>
			{/if}

			{#if overview}
				<section class="kpi-grid" aria-label="Key performance indicators">
					<DashboardStatCard
						label="Revenue"
						value={formatCurrency(overview.revenue)}
						icon={IndianRupee}
						subtext={`${data.summary.revenue.paidOrders} paid orders`}
						href="/admin/orders"
					/>
					<DashboardStatCard
						label="Orders"
						value={fmtNumber(overview.orders)}
						icon={ShoppingCart}
						subtext={`${data.summary.orders.total} total`}
						href="/admin/orders"
					/>
					<DashboardStatCard
						label="Customers"
						value={fmtNumber(overview.customers)}
						icon={Users}
						subtext={`${data.summary.customers.newThisMonth} new this month`}
						href="/admin/customers"
					/>
					<DashboardStatCard
						label="Downloads"
						value={fmtNumber(overview.downloads)}
						icon={Download}
						subtext={`${data.summary.downloads.today} today`}
						href="/admin/downloads"
					/>
					<DashboardStatCard
						label="Products"
						value={fmtNumber(overview.products)}
						icon={Package}
						subtext={`${data.summary.products.inactive} inactive`}
						href="/admin/products"
					/>
					<EmailStatsCard label="Emails" value={fmtNumber(overview.emails)} icon={Mail} />
					<EmailStatsCard label="Conversion Rate" value={fmtPercent(overview.conversionRate)} icon={Percent} />
					<EmailStatsCard label="Avg Order Value" value={formatCurrency(overview.averageOrderValue)} icon={Receipt} />
				</section>

				<section class="breakdown-strip" aria-label="Detailed metrics breakdown">
					<div class="bs-group">
						<span class="bs-label">Revenue</span>
						<span class="bs-item bs-paid">Paid: {data.summary.revenue.paidOrders}</span>
						<span class="bs-item bs-pending">Pending: {data.summary.revenue.pendingPayments}</span>
						<span class="bs-item bs-failed">Failed: {data.summary.revenue.failedPayments}</span>
					</div>
					<div class="bs-divider" aria-hidden="true"></div>
					<div class="bs-group">
						<span class="bs-label">Customers</span>
						<span class="bs-item">Verified: {data.summary.customers.verified}</span>
						<span class="bs-item">Unverified: {data.summary.customers.unverified}</span>
					</div>
					<div class="bs-divider" aria-hidden="true"></div>
					<div class="bs-group">
						<span class="bs-label">Downloads</span>
						<span class="bs-item bs-active">Active: {data.summary.downloads.activeTokens}</span>
						<span class="bs-item bs-expired">Expired: {data.summary.downloads.expiredTokens}</span>
					</div>
					<div class="bs-divider" aria-hidden="true"></div>
					<div class="bs-group">
						<span class="bs-label">Products</span>
						<span class="bs-item">Published: {data.summary.products.published}</span>
						<span class="bs-item bs-inactive">Inactive: {data.summary.products.inactive}</span>
					</div>
				</section>

				{#if growth}
					<AdminSection title="Growth (current vs previous period)">
						<div class="growth-grid">
							<AnalyticsComparisonCard label="Revenue" metric={growth.revenue} icon={IndianRupee} valueFormatter={formatCurrency} />
							<AnalyticsComparisonCard label="Customers" metric={growth.customers} icon={Users} valueFormatter={fmtNumber} />
							<AnalyticsComparisonCard label="Orders" metric={growth.orders} icon={ShoppingCart} valueFormatter={fmtNumber} />
							<AnalyticsComparisonCard label="Downloads" metric={growth.downloads} icon={Download} valueFormatter={fmtNumber} />
						</div>
					</AdminSection>
				{/if}

				<div class="charts-grid">
					{#if revenue}
						<AdminSection title="Revenue over time">
							<AnalyticsChart type="line" data={toChart(revenue.trend)} color="#5a7a1a" valueFormatter={formatCurrency} loading={analyticsLoading} ariaLabel="Revenue over time" />
							<div class="mini-stats">
								<span><strong>{formatCurrency(revenue.paid)}</strong> Paid</span>
								<span><strong>{formatCurrency(revenue.pending)}</strong> Pending</span>
								<span><strong>{formatCurrency(revenue.failed)}</strong> Failed</span>
								<span><strong>{formatCurrency(revenue.refunded)}</strong> Refunded</span>
							</div>
						</AdminSection>
					{/if}

					{#if orders}
						<AdminSection title="Orders over time">
							<AnalyticsChart type="bar" data={toChart(orders.daily)} color="#3b82f6" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Orders over time" />
							<div class="mini-stats">
								<span><strong>{orders.paid}</strong> Paid</span>
								<span><strong>{orders.pending}</strong> Pending</span>
								<span><strong>{orders.failed}</strong> Failed</span>
								<span><strong>{orders.refunded}</strong> Refunded</span>
							</div>
						</AdminSection>
					{/if}

					{#if customers}
						<AdminSection title="Customer growth">
							<AnalyticsChart type="line" data={toChart(customers.trend)} color="#8b5cf6" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Customer growth" />
							<div class="mini-stats">
								<span><strong>{customers.verified}</strong> Verified</span>
								<span><strong>{customers.unverified}</strong> Unverified</span>
								<span><strong>{customers.oauth}</strong> OAuth</span>
								<span><strong>{customers.returning}</strong> Returning</span>
							</div>
						</AdminSection>
					{/if}

					{#if emails}
						<AdminSection title="Email activity">
							<AnalyticsChart type="line" data={toChart(emails.daily)} color="#14b8a6" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Email activity" />
							<div class="mini-stats">
								<span><strong>{emails.sent}</strong> Sent</span>
								<span><strong>{emails.failed}</strong> Failed</span>
								<span><strong>{emails.queued}</strong> Queued</span>
								<span><strong>{emails.successRate}%</strong> Success</span>
							</div>
						</AdminSection>
					{/if}

					{#if downloads}
						<AdminSection title="Downloads over time">
							<AnalyticsChart type="line" data={toChart(downloads.trend)} color="#d97706" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Downloads over time" />
						</AdminSection>
					{/if}

					{#if products}
						<AdminSection title="Top selling products">
							<AnalyticsChart type="bar" data={toNamed(products.topSelling)} color="#5a7a1a" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Top selling products by orders" />
							<div class="mini-stats">
								<span><strong>{products.published}</strong> Published</span>
								<span><strong>{products.draft}</strong> Draft</span>
								<span><strong>{products.archived}</strong> Archived</span>
							</div>
						</AdminSection>
					{/if}

					{#if products && products.mostDownloaded.length > 0}
						<AdminSection title="Most downloaded products">
							<AnalyticsChart type="bar" data={toNamed(products.mostDownloaded)} color="#3b82f6" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Most downloaded products" />
						</AdminSection>
					{/if}

					{#if emails && emails.byType.length > 0}
						<AdminSection title="Email types">
							<AnalyticsChart type="pie" data={emailTypeChart(emails.byType)} valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Email types breakdown" />
						</AdminSection>
					{/if}

					{#if traffic}
						<AdminSection title="Internal traffic">
							<AnalyticsChart type="bar" data={traffic.byCategory.map((c) => ({ label: c.category, value: c.count }))} color="#64748b" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Internal traffic by category" />
						</AdminSection>
					{/if}
				</div>

				<!-- System Health -->
				<section class="health-strip" aria-label="System health">
					<span class="health-strip-label">System</span>
					{#each Object.entries(data.systemHealth) as [key, status]}
						<span class="health-strip-item">
							<span class="hs-dot" style="background: {healthColor(status)};" aria-hidden="true"></span>
							{systemLabel(key)}
							<span class="hs-status" style="color: {healthColor(status)};">{status}</span>
						</span>
					{/each}
				</section>
			{/if}
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

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.breakdown-strip {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		padding: 0.65rem 1rem;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		margin-bottom: 1.5rem;
		font-size: 0.8rem;
	}

	.bs-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.bs-label {
		font-weight: 600;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		margin-right: 0.15rem;
	}

	.bs-item {
		opacity: 0.7;
	}

	.bs-paid { color: #5a7a1a; font-weight: 600; }
	.bs-pending { color: #3b82f6; font-weight: 600; }
	.bs-failed { color: #ef4444; font-weight: 600; }
	.bs-active { color: #22c55e; font-weight: 600; }
	.bs-expired { color: #ef4444; font-weight: 600; }
	.bs-inactive { color: #ef4444; font-weight: 600; }

	.bs-divider {
		width: 1px;
		height: 1.2rem;
		background: var(--color-glass-border);
		flex-shrink: 0;
	}

	.growth-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
		gap: 1.25rem;
		margin-top: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.mini-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 0.85rem;
		font-size: 0.82rem;
		opacity: 0.7;
	}

	.mini-stats strong {
		font-weight: 700;
		opacity: 0.9;
	}

	.analytics-error {
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.health-strip {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.25rem;
		padding: 0.65rem 1rem;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		margin-top: 1rem;
		font-size: 0.8rem;
	}

	.health-strip-label {
		font-weight: 600;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
	}

	.health-strip-item {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		opacity: 0.7;
	}

	.hs-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.hs-status {
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	@media (max-width: 768px) {
		.quick-actions {
			width: 100%;
		}

		.quick-actions :global(.btn) {
			flex: 1;
			min-width: 0;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}

		.breakdown-strip {
			flex-direction: column;
			align-items: flex-start;
		}

		.bs-divider {
			display: none;
		}
	}
</style>
