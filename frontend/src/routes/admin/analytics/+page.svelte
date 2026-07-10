<script lang="ts">
  import { onMount } from 'svelte';
  import {
    IndianRupee,
    ShoppingCart,
    Users,
    Download,
    Package,
    Mail,
    Percent,
    Receipt,
    TrendingUp,
    BarChart3,
  } from '@lucide/svelte';
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
    AdminApiError,
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
  import EmailStatsCard from '$lib/admin/components/EmailStatsCard.svelte';
  import AnalyticsChart from '$lib/admin/components/AnalyticsChart.svelte';
  import AnalyticsFilterBar from '$lib/admin/components/AnalyticsFilterBar.svelte';
  import AnalyticsComparisonCard from '$lib/admin/components/AnalyticsComparisonCard.svelte';

  let range = $state<AnalyticsRange>('month');
  let start = $state('');
  let end = $state('');

  let loading = $state(true);
  let error = $state<string | null>(null);

  let overview = $state<AnalyticsOverview | null>(null);
  let revenue = $state<RevenueAnalytics | null>(null);
  let orders = $state<OrdersAnalytics | null>(null);
  let downloads = $state<DownloadsAnalytics | null>(null);
  let products = $state<ProductsAnalytics | null>(null);
  let customers = $state<CustomersAnalytics | null>(null);
  let emails = $state<EmailsAnalytics | null>(null);
  let growth = $state<GrowthAnalytics | null>(null);
  let traffic = $state<TrafficAnalytics | null>(null);

  function query(): AnalyticsQuery {
    return { range, start, end };
  }

  async function load() {
    loading = true;
    error = null;
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
      error = err instanceof AdminApiError ? err.message : 'Failed to load analytics';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function onRangeChange(next: { range: AnalyticsRange; start: string; end: string }) {
    range = next.range;
    start = next.start;
    end = next.end;
    load();
  }

  const fmtCurrency = (n: number) =>
    '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fmtNumber = (n: number) => n.toLocaleString('en-IN');
  const fmtPercent = (n: number) => `${n}%`;

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

<AdminPageHeader title="Analytics" description="Business insights across revenue, orders, customers, downloads, products, and email">
  {#if overview}
    <span class="range-note">{range === 'custom' ? 'Custom range' : range.charAt(0).toUpperCase() + range.slice(1)}</span>
  {/if}
</AdminPageHeader>

<AdminPage {loading} {error} onRetry={load}>
  {#if overview}
    <AnalyticsFilterBar {range} {start} {end} onchange={onRangeChange} disabled={loading} />

    <div class="kpi-grid">
      <EmailStatsCard label="Revenue" value={fmtCurrency(overview.revenue)} icon={IndianRupee} variant="success" />
      <EmailStatsCard label="Orders" value={fmtNumber(overview.orders)} icon={ShoppingCart} />
      <EmailStatsCard label="Customers" value={fmtNumber(overview.customers)} icon={Users} />
      <EmailStatsCard label="Downloads" value={fmtNumber(overview.downloads)} icon={Download} />
      <EmailStatsCard label="Products" value={fmtNumber(overview.products)} icon={Package} />
      <EmailStatsCard label="Emails" value={fmtNumber(overview.emails)} icon={Mail} />
      <EmailStatsCard label="Conversion Rate" value={fmtPercent(overview.conversionRate)} icon={Percent} />
      <EmailStatsCard label="Avg Order Value" value={fmtCurrency(overview.averageOrderValue)} icon={Receipt} />
    </div>

    {#if growth}
      <AdminSection title="Growth (current vs previous period)">
        <div class="growth-grid">
          <AnalyticsComparisonCard label="Revenue" metric={growth.revenue} icon={IndianRupee} valueFormatter={fmtCurrency} />
          <AnalyticsComparisonCard label="Customers" metric={growth.customers} icon={Users} valueFormatter={fmtNumber} />
          <AnalyticsComparisonCard label="Orders" metric={growth.orders} icon={ShoppingCart} valueFormatter={fmtNumber} />
          <AnalyticsComparisonCard label="Downloads" metric={growth.downloads} icon={Download} valueFormatter={fmtNumber} />
        </div>
      </AdminSection>
    {/if}

    <div class="charts-grid">
      {#if revenue}
        <AdminSection title="Revenue over time">
          <AnalyticsChart type="line" data={toChart(revenue.trend)} color="#5a7a1a" valueFormatter={fmtCurrency} {loading} ariaLabel="Revenue over time" />
          <div class="mini-stats">
            <span><strong>{fmtCurrency(revenue.paid)}</strong> Paid</span>
            <span><strong>{fmtCurrency(revenue.pending)}</strong> Pending</span>
            <span><strong>{fmtCurrency(revenue.failed)}</strong> Failed</span>
            <span><strong>{fmtCurrency(revenue.refunded)}</strong> Refunded</span>
          </div>
        </AdminSection>
      {/if}

      {#if orders}
        <AdminSection title="Orders over time">
          <AnalyticsChart type="bar" data={toChart(orders.daily)} color="#3b82f6" valueFormatter={fmtNumber} {loading} ariaLabel="Orders over time" />
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
          <AnalyticsChart type="line" data={toChart(customers.trend)} color="#8b5cf6" valueFormatter={fmtNumber} {loading} ariaLabel="Customer growth" />
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
          <AnalyticsChart type="line" data={toChart(emails.daily)} color="#14b8a6" valueFormatter={fmtNumber} {loading} ariaLabel="Email activity" />
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
          <AnalyticsChart type="line" data={toChart(downloads.trend)} color="#d97706" valueFormatter={fmtNumber} {loading} ariaLabel="Downloads over time" />
        </AdminSection>
      {/if}

      {#if products}
        <AdminSection title="Top selling products">
          <AnalyticsChart type="bar" data={toNamed(products.topSelling)} color="#5a7a1a" valueFormatter={fmtNumber} {loading} ariaLabel="Top selling products by orders" />
          <div class="mini-stats">
            <span><strong>{products.published}</strong> Published</span>
            <span><strong>{products.draft}</strong> Draft</span>
            <span><strong>{products.archived}</strong> Archived</span>
          </div>
        </AdminSection>
      {/if}

      {#if products && products.mostDownloaded.length > 0}
        <AdminSection title="Most downloaded products">
          <AnalyticsChart type="bar" data={toNamed(products.mostDownloaded)} color="#3b82f6" valueFormatter={fmtNumber} {loading} ariaLabel="Most downloaded products" />
        </AdminSection>
      {/if}

      {#if emails && emails.byType.length > 0}
        <AdminSection title="Email types">
          <AnalyticsChart type="pie" data={emailTypeChart(emails.byType)} valueFormatter={fmtNumber} {loading} ariaLabel="Email types breakdown" />
        </AdminSection>
      {/if}

      {#if traffic}
        <AdminSection title="Internal traffic">
          <AnalyticsChart type="bar" data={traffic.byCategory.map((c) => ({ label: c.category, value: c.count }))} color="#64748b" valueFormatter={fmtNumber} {loading} ariaLabel="Internal traffic by category" />
        </AdminSection>
      {/if}
    </div>
  {/if}
</AdminPage>

<style>
  .range-note {
    font-size: 0.8rem;
    opacity: 0.55;
    font-weight: 600;
    text-transform: capitalize;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
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
  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
