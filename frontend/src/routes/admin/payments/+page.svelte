<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import PaymentStatusBadge from '$lib/admin/components/PaymentStatusBadge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminToolbar from '$lib/admin/components/AdminToolbar.svelte';
	import AdminFilterBar from '$lib/admin/components/AdminFilterBar.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminSelect from '$lib/admin/components/AdminSelect.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	interface PaymentListItem {
		id: string;
		order_number: string;
		customer_email: string;
		customer_name: string | null;
		amount: number;
		currency: string;
		status: string;
		payment_provider: string;
		razorpay_order_id: string;
		created_at: string;
	}

	interface PaymentListResponse {
		payments: PaymentListItem[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	}

	let payments = $state<PaymentListItem[]>([]);
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
	let productOptions = $state<Array<{ id: string; name: string }>>([]);

	async function loadPayments() {
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

			const result = await adminFetch<PaymentListResponse>(`/payments?${params}`);
			payments = result.payments;
			total = result.total;
			page = result.page;
			totalPages = result.totalPages;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load payments';
			}
		} finally {
			loading = false;
		}
	}

	async function loadProducts() {
		try {
			const result = await adminFetch<{ products: Array<{ id: string; name: string }> }>('/products?perPage=100');
			productOptions = result.products;
		} catch {
			// non-critical
		}
	}

	onMount(() => {
		loadProducts();
		loadPayments();
	});

	function handleSearch() {
		page = 1;
		loadPayments();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function goToPage(p: number) {
		page = p;
		loadPayments();
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
		loadPayments();
	}
</script>

<svelte:head>
	<title>Payments | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Payments" description="View payment transactions and refunds">
		<Button variant="ghost" href="/admin/orders">View Orders</Button>
	</AdminPageHeader>

	<AdminPage {loading} {error} onRetry={loadPayments}>
		<AdminToolbar>
			<div class="search-bar-wrapper">
				<AdminInput
					type="text"
					bind:value={search}
					placeholder="Search by name, email, order ID, or payment ID..."
					onkeydown={handleKeydown}
					aria-label="Search payments"
					icon={Search}
				/>
			</div>
			<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)} class="btn-with-icon">
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
						{ value: 'paid', label: 'Paid' },
						{ value: 'created', label: 'Pending' },
						{ value: 'failed', label: 'Failed' },
						{ value: 'refunded', label: 'Refunded' }
					]}
					class="filter-select"
					onchange={loadPayments}
				/>
				<AdminSelect
					bind:value={productFilter}
					options={[
						{ value: '', label: 'All Products' },
						...productOptions.map(p => ({ value: p.id, label: p.name }))
					]}
					class="filter-select"
					onchange={loadPayments}
				/>
				<AdminInput
					type="date"
					bind:value={dateFrom}
					class="filter-date"
					onchange={loadPayments}
					aria-label="From Date"
				/>
				<AdminInput
					type="date"
					bind:value={dateTo}
					class="filter-date"
					onchange={loadPayments}
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
					onchange={loadPayments}
				/>
				<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
			</AdminFilterBar>
		{/if}

		{#if payments.length === 0}
			<AdminSection>
				<AdminEmptyState
					title="No payments found"
					message={search || statusFilter || productFilter || dateFrom || dateTo
						? 'Try adjusting your search or filters.'
						: 'Payments will appear here once customers start purchasing.'}
				/>
			</AdminSection>
		{:else}
			<AdminTable>
				<thead>
					<tr>
						<th>Payment ID</th>
						<th>Order</th>
						<th>Customer</th>
						<th>Amount</th>
						<th>Currency</th>
						<th>Gateway</th>
						<th>Status</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each payments as payment}
						<tr
							class="payment-row"
							onclick={() => window.location.href = `/admin/payments/${payment.id}`}
							role="link"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/admin/payments/${payment.id}`)}
						>
							<td class="id-cell"><code>#{payment.id.substring(0, 8)}</code></td>
							<td class="mono-cell">{payment.razorpay_order_id.substring(0, 16)}...</td>
							<td>
								<div class="customer-info">
									<span class="customer-name">{payment.customer_name || 'Guest'}</span>
									<span class="customer-email">{payment.customer_email}</span>
								</div>
							</td>
							<td class="amount-cell">{formatPrice(payment.amount, payment.currency)}</td>
							<td>{payment.currency}</td>
							<td>{payment.payment_provider}</td>
							<td><PaymentStatusBadge status={payment.status} /></td>
							<td class="date-cell">{formatDate(payment.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</AdminTable>

			{#if totalPages > 1}
				<div class="pagination">
					<span class="pagination-info">
						Page {page} of {totalPages} ({total} payments)
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

	.payment-row {
		cursor: pointer;
	}

	.id-cell code {
		font-size: 0.8rem;
		opacity: 0.7;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.mono-cell {
		font-family: var(--font-accent);
		font-size: 0.85rem;
		opacity: 0.7;
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
