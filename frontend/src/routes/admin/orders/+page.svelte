<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import OrderStatusBadge from '$lib/admin/components/OrderStatusBadge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminToolbar from '$lib/admin/components/AdminToolbar.svelte';
	import AdminFilterBar from '$lib/admin/components/AdminFilterBar.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminSelect from '$lib/admin/components/AdminSelect.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	interface OrderListItem {
		id: string;
		order_number: string;
		customer_email: string;
		customer_name: string | null;
		customer_id: string | null;
		amount: number;
		currency: string;
		status: string;
		payment_id: string | null;
		created_at: string;
	}

	interface OrderListResponse {
		orders: OrderListItem[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	}

	let orders = $state<OrderListItem[]>([]);
	let total = $state(0);
	let page = $state(1);
	let totalPages = $state(0);
	let perPage = $state(20);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let statusFilter = $state('');
	let productFilter = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let sort = $state('newest');

	let showFilters = $state(false);
	let statusOptions = $state<string[]>([]);
	let productOptions = $state<Array<{ id: string; name: string }>>([]);

	async function loadOrders() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams();
			if (search) params.set('search', search);
			if (statusFilter) params.set('status', statusFilter);
			if (productFilter) params.set('product', productFilter);
			if (dateFrom) params.set('dateFrom', dateFrom);
			if (dateTo) params.set('dateTo', dateTo);
			params.set('sort', sort);
			params.set('page', String(page));
			params.set('perPage', String(perPage));

			const result = await adminFetch<OrderListResponse>(`/orders?${params}`);
			orders = result.orders;
			total = result.total;
			page = result.page;
			totalPages = result.totalPages;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load orders';
			}
		} finally {
			loading = false;
		}
	}

	async function loadMetadata() {
		try {
			const [meta, prodRes] = await Promise.all([
				adminFetch<{ statuses: string[] }>('/orders/metadata'),
				adminFetch<{ products: Array<{ id: string; name: string }> }>('/products?perPage=100')
			]);
			statusOptions = meta.statuses;
			productOptions = prodRes.products;
		} catch {
			// non-critical
		}
	}

	onMount(() => {
		loadMetadata();
		loadOrders();
	});

	function handleSearch() {
		page = 1;
		loadOrders();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function goToPage(p: number) {
		page = p;
		loadOrders();
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

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function clearFilters() {
		search = '';
		statusFilter = '';
		productFilter = '';
		dateFrom = '';
		dateTo = '';
		sort = 'newest';
		page = 1;
		loadOrders();
	}
</script>

<svelte:head>
	<title>Orders | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Orders" description="View and manage customer orders">
		<Button variant="ghost" href="/admin/payments">
			View Payments
		</Button>
	</AdminPageHeader>

	<AdminPage {loading} {error} onRetry={loadOrders}>
		<AdminToolbar>
			<div class="search-bar-wrapper">
				<AdminInput
					type="text"
					bind:value={search}
					placeholder="Search by name, email, order ID, or payment ID..."
					onkeydown={handleKeydown}
					aria-label="Search orders"
					icon={Search}
				/>
			</div>
			<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)}>
				<SlidersHorizontal size={16} />
				Filters
			</Button>
		</AdminToolbar>

		{#if showFilters}
			<AdminFilterBar>
				<AdminSelect
					bind:value={statusFilter}
					options={[
						{ value: '', label: 'All Statuses' },
						...statusOptions.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
					]}
					class="filter-select"
					onchange={loadOrders}
				/>
				<AdminSelect
					bind:value={productFilter}
					options={[
						{ value: '', label: 'All Products' },
						...productOptions.map(p => ({ value: p.id, label: p.name }))
					]}
					class="filter-select"
					onchange={loadOrders}
				/>
				<AdminInput
					type="date"
					bind:value={dateFrom}
					class="filter-date"
					onchange={loadOrders}
					aria-label="From Date"
				/>
				<AdminInput
					type="date"
					bind:value={dateTo}
					class="filter-date"
					onchange={loadOrders}
					aria-label="To Date"
				/>
				<AdminSelect
					bind:value={sort}
					options={[
						{ value: 'newest', label: 'Newest First' },
						{ value: 'oldest', label: 'Oldest First' },
						{ value: 'amount', label: 'Amount (High)' },
						{ value: 'status', label: 'Status' }
					]}
					class="filter-select"
					onchange={loadOrders}
				/>
				<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
			</AdminFilterBar>
		{/if}

		{#if orders.length === 0}
			<AdminSection>
				<AdminEmptyState
					title="No orders found"
					message={search || statusFilter || productFilter || dateFrom || dateTo
						? 'Try adjusting your search or filters.'
						: 'Orders will appear here once customers make purchases.'}
				/>
			</AdminSection>
		{:else}
			<AdminTable>
				<thead>
					<tr>
						<th>Order Number</th>
						<th>Customer</th>
						<th>Amount</th>
						<th>Status</th>
						<th>Payment ID</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					{#each orders as order}
						<tr
							class="order-row"
							onclick={() => window.location.href = `/admin/orders/${order.id}`}
							role="link"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/admin/orders/${order.id}`)}
						>
							<td class="id-cell"><code>{order.order_number}</code></td>
							<td>
								<div class="customer-info">
									<span class="customer-name">{order.customer_name || 'Guest'}</span>
									<span class="customer-email">{order.customer_email}</span>
								</div>
							</td>
							<td class="amount-cell">{formatPrice(order.amount, order.currency)}</td>
							<td><OrderStatusBadge status={order.status} /></td>
							<td class="id-cell">
								{#if order.payment_id}
									<code>{order.payment_id.substring(0, 15)}...</code>
								{:else}
									—
								{/if}
							</td>
							<td class="date-cell">{formatDate(order.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</AdminTable>

			{#if totalPages > 1}
				<div class="pagination">
					<span class="pagination-info">
						Page {page} of {totalPages} ({total} orders)
					</span>
					<AdminButtonGroup align="right" class="pagination-buttons">
						<Button variant="ghost" size="sm" disabled={page <= 1} onclick={() => goToPage(page - 1)}>
							Previous
						</Button>
						{#each { length: Math.min(totalPages, 5) } as _, i}
							{@const p = i + 1}
							<Button
								variant={p === page ? 'primary' : 'ghost'}
								size="sm"
								onclick={() => goToPage(p)}
							>
								{p}
							</Button>
						{/each}
						<Button variant="ghost" size="sm" disabled={page >= totalPages} onclick={() => goToPage(page + 1)}>
							Next
						</Button>
					</AdminButtonGroup>
				</div>
			{/if}
		{/if}
	</AdminPage>
</AdminPageContainer>

<style>
	.search-bar-wrapper {
		flex: 1;
		min-width: 220px;
	}

	:global(.filter-select) {
		min-width: 160px;
	}

	:global(.filter-date.admin-input-group) {
		min-width: 130px;
	}

	.order-row {
		cursor: pointer;
	}

	.id-cell code {
		font-size: 0.8rem;
		opacity: 0.7;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.customer-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.customer-name {
		font-weight: 600;
	}

	.customer-email {
		font-size: 0.8rem;
		opacity: 0.55;
	}

	.amount-cell {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.date-cell {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.pagination-info {
		font-size: 0.85rem;
		opacity: 0.6;
	}

	@media (max-width: 768px) {
		.search-bar-wrapper {
			width: 100%;
		}

		:global(.filter-select) {
			width: 100% !important;
		}

		:global(.filter-date.admin-input-group) {
			width: 100% !important;
		}
	}
</style>
