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
		Settings,
		MessageSquare,
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
	import ActivityTimeline from '$lib/admin/components/ActivityTimeline.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';
	import Button from '$lib/components/ui/Button.svelte';

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
		recentActivity: Array<{
			id: string; event: string; user_id: string | null; user_name: string | null;
			metadata: Record<string, unknown>; created_at: string;
		}>;
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
			const [o, r, ord, dl, pr, cu, gr, tr] = await Promise.all([
				getOverview(query()),
				getRevenue(query()),
				getOrders(query()),
				getDownloads(query()),
				getProducts(query()),
				getCustomers(query()),
				getGrowth(query()),
				getTraffic(query()),
			]);
			overview = o;
			revenue = r;
			orders = ord;
			downloads = dl;
			products = pr;
			customers = cu;
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

	function trendText(deltaPct: number | null | undefined): string {
		if (deltaPct == null) return '';
		const abs = Math.abs(deltaPct);
		const formatted = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
		if (deltaPct > 0) return `↑ {formatted}% vs previous`;
		if (deltaPct < 0) return `↓ {formatted}% vs previous`;
		return '— 0% vs previous';
	}

	function healthColor(status: string): string {
		if (status === 'healthy') return 'var(--color-accent-green)';
		if (status === 'warning') return '#f59e0b';
		return '#ef4444';
	}

	function systemLabel(key: string): string {
		const labels: Record<string, string> = {
			backend: 'Backend', database: 'Database', email: 'Email',
			payments: 'Payments', storage: 'Storage',
		};
		return labels[key] || key;
	}

	function toChart(data: { date: string; value: number }[]) {
		return data.map((p) => ({ label: p.date, value: p.value }));
	}
	function toNamed(items: { product: string; orders?: number; downloads?: number; count?: number }[]) {
		return items.map((i) => ({ label: i.product || '—', value: i.orders ?? i.downloads ?? i.count ?? 0 }));
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Dashboard" description="Executive overview of business performance, sales, and key metrics.">
		<AdminButtonGroup align="right" class="dashboard-actions">
			<Button variant="outline" size="sm" href="/admin/products">
				<Plus size={14} aria-hidden="true" /> New Product
			</Button>
			<Button variant="outline" size="sm" href="/admin/orders">Orders</Button>
			<Button variant="outline" size="sm" href="/admin/customers">Customers</Button>
			<Button variant="outline" size="sm" href="/admin/communication">
				<MessageSquare size={14} aria-hidden="true" /> Communication
			</Button>
			<Button variant="outline" size="sm" href="/admin/settings">
				<Settings size={14} aria-hidden="true" /> Settings
			</Button>
		</AdminButtonGroup>
	</AdminPageHeader>

	<AdminPage loading={pageLoading} error={dashError} onRetry={handleRetry}>
		{#if data}
			<AdminStack gap="md">
				<AnalyticsFilterBar {range} {start} {end} onchange={onRangeChange} disabled={analyticsLoading} />

				{#if analyticsError}
					<div class="alert alert-error analytics-error" role="alert">
						{analyticsError}
						<Button variant="ghost" size="sm" onclick={() => loadAnalytics()}>Retry</Button>
					</div>
				{/if}

				{#if overview}
					<!-- KPIs -->
					<section aria-label="Key performance indicators">
						<AdminGrid cols={{ default: 1, sm: 2, md: 3, lg: 6 }} gap="sm">
							<DashboardStatCard
								label="Revenue"
								value={formatCurrency(overview.revenue)}
								icon={IndianRupee}
								subtext={growth ? trendText(growth.revenue.deltaPct) : ''}
								href="/admin/orders"
							/>
							<DashboardStatCard
								label="Orders"
								value={fmtNumber(overview.orders)}
								icon={ShoppingCart}
								subtext={growth ? trendText(growth.orders.deltaPct) : ''}
								href="/admin/orders"
							/>
							<DashboardStatCard
								label="Customers"
								value={fmtNumber(overview.customers)}
								icon={Users}
								subtext={growth ? trendText(growth.customers.deltaPct) : ''}
								href="/admin/customers"
							/>
							<DashboardStatCard
								label="Downloads"
								value={fmtNumber(overview.downloads)}
								icon={Download}
								subtext={growth ? trendText(growth.downloads.deltaPct) : ''}
								href="/admin/downloads"
							/>
							<DashboardStatCard
								label="Products"
								value={fmtNumber(overview.products)}
								icon={Package}
								subtext={`${data.summary.products.published} published, ${data.summary.products.inactive} inactive`}
								href="/admin/products"
							/>
							<EmailStatsCard label="Conversion Rate" value={fmtPercent(overview.conversionRate)} icon={Percent} />
						</AdminGrid>
					</section>

					<!-- Revenue & Sales -->
					<AdminStack gap="sm">
						<h2 class="group-title">Revenue & Sales</h2>
						<AdminGrid cols={{ default: 1, xl: 3 }} gap="md">
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
										<span><strong>{fmtNumber(customers.newCustomers)}</strong> New</span>
										<span><strong>{fmtNumber(customers.returning)}</strong> Returning</span>
										<span><strong>{fmtNumber(customers.verified)}</strong> Verified</span>
									</div>
								</AdminSection>
							{/if}
						</AdminGrid>
					</AdminStack>

					<!-- Product Insights -->
					<AdminStack gap="sm">
						<h2 class="group-title">Product Insights</h2>
						<AdminGrid cols={{ default: 1, lg: 2 }} gap="md">
							{#if products && products.topSelling.length > 0}
								<AdminSection title="Top selling products">
									<AnalyticsChart type="bar" data={toNamed(products.topSelling)} color="#5a7a1a" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Top selling products by orders" />
								</AdminSection>
							{/if}
							{#if products && products.mostDownloaded.length > 0}
								<AdminSection title="Most downloaded products">
									<AnalyticsChart type="bar" data={toNamed(products.mostDownloaded)} color="#3b82f6" valueFormatter={fmtNumber} loading={analyticsLoading} ariaLabel="Most downloaded products" />
								</AdminSection>
							{/if}
						</AdminGrid>
					</AdminStack>

					<!-- Customer Insights -->
					{#if customers}
						<AdminSection title="Customer Insights">
							<AdminGrid cols={{ default: 2, lg: 4 }} gap="sm">
								<EmailStatsCard label="New Customers" value={fmtNumber(customers.newCustomers)} icon={Users} variant="success" />
								<EmailStatsCard label="Returning" value={fmtNumber(customers.returning)} icon={Users} />
								<EmailStatsCard
									label="Email Verified"
									value={customers.total > 0 ? `${((customers.verified / customers.total) * 100).toFixed(0)}%` : '—'}
									icon={Mail}
									variant="success"
								/>
								<EmailStatsCard label="OAuth Accounts" value={fmtNumber(customers.oauth)} icon={Users} variant="warning" />
							</AdminGrid>
						</AdminSection>
					{/if}

					<!-- Communication Summary -->
					{#if traffic}
						<AdminSection title="Communication Summary">
							<AdminGrid cols={{ default: 2, lg: 4 }} gap="sm">
								<EmailStatsCard label="Contact Messages" value={fmtNumber(traffic.contacts)} icon={MessageSquare} />
								<EmailStatsCard label="Feedback" value={fmtNumber(traffic.feedback)} icon={Mail} />
								<EmailStatsCard label="Newsletter Signups" value={fmtNumber(traffic.newsletter)} icon={Mail} variant="success" />
								<EmailStatsCard label="Career Applications" value={fmtNumber(traffic.careers)} icon={Users} />
							</AdminGrid>
						</AdminSection>
					{/if}

					<!-- Recent Activity -->
					<AdminSection title="Recent Activity">
						<ActivityTimeline entries={data.recentActivity || []} />
					</AdminSection>

					<!-- System Health -->
					<AdminCard class="health-strip-card">
						<div class="health-strip" aria-label="System health">
							<span class="health-strip-label">System</span>
							{#each ['backend', 'database', 'storage', 'email', 'payments'] as key}
								{@const status = data.systemHealth[key as keyof typeof data.systemHealth] || 'unknown'}
								<span class="health-strip-item">
									<span class="hs-dot" style="background: {healthColor(status)};" aria-hidden="true"></span>
									{systemLabel(key)}
									<span class="hs-status" style="color: {healthColor(status)};">{status}</span>
								</span>
							{/each}
						</div>
					</AdminCard>
				{/if}
			</AdminStack>
		{/if}
	</AdminPage>
</AdminPageContainer>

<style>
	.group-title {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-primary-green);
	}

	.mini-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 0.85rem;
		font-size: 0.8rem;
		opacity: 0.6;
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

	:global(.health-strip-card.admin-card) {
		padding: 0.65rem 1rem;
	}

	.health-strip {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.25rem;
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

	@media (max-width: 640px) {
		:global(.dashboard-actions.admin-btn-group) {
			flex-direction: column;
		}
	}
</style>
