<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, CreditCard } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PaymentStatusBadge from '$lib/admin/components/PaymentStatusBadge.svelte';

	interface PaymentListItem {
		id: string;
		razorpay_order_id: string;
		razorpay_payment_id: string | null;
		customer_name: string | null;
		customer_email: string;
		product_name: string;
		amount: number;
		currency: string;
		status: string;
		payment_provider: string;
		created_at: string;
		updated_at: string;
	}

	interface PaymentListResponse {
		payments: PaymentListItem[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	}

	interface FilterOption {
		products: { id: string; name: string }[];
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
	let productOptions = $state<{ id: string; name: string }[]>([]);

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

	async function loadOptions() {
		try {
			const result = await adminFetch<FilterOption>('/payments/options');
			productOptions = result.products;
		} catch {
			// non-critical
		}
	}

	onMount(() => {
		loadOptions();
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

<AdminPageHeader title="Payments" description="View payment transactions and refunds">
	<Button variant="ghost" href="/admin/orders">View Orders</Button>
</AdminPageHeader>

<AdminPage {loading} {error} onRetry={loadPayments}>
	<div class="toolbar">
		<div class="search-bar">
			<span class="search-icon"><Search size={16} /></span>
			<input
				type="text"
				bind:value={search}
				placeholder="Search by name, email, order ID, or payment ID..."
				onkeydown={handleKeydown}
				aria-label="Search payments"
			/>
		</div>
		<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)}>
			<SlidersHorizontal size={16} />
			Filters
		</Button>
	</div>

	{#if showFilters}
		<div class="filters-bar">
			<Input
				type="select"
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
			<Input
				type="select"
				bind:value={productFilter}
				options={[
					{ value: '', label: 'All Products' },
					...productOptions.map(p => ({ value: p.id, label: p.name }))
				]}
				class="filter-select"
				onchange={loadPayments}
			/>
			<input
				type="date"
				bind:value={dateFrom}
				placeholder="From date"
				class="filter-date"
				onchange={loadPayments}
			/>
			<input
				type="date"
				bind:value={dateTo}
				placeholder="To date"
				class="filter-date"
				onchange={loadPayments}
			/>
			<Input
				type="select"
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
		</div>
	{/if}

	{#if payments.length === 0}
		<AdminSection>
			<AdminEmptyState
				title="No payments found"
				message={search || statusFilter || productFilter
					? 'Try adjusting your search or filters.'
					: 'Payments will appear here once customers start purchasing.'}
			/>
		</AdminSection>
	{:else}
		<AdminTableContainer>
			<table>
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
			</table>
		</AdminTableContainer>

		{#if totalPages > 1}
			<div class="pagination">
				<span class="pagination-info">Page {page} of {totalPages} ({total} payments)</span>
				<div class="pagination-buttons">
					<Button variant="ghost" size="sm" disabled={page <= 1} onclick={() => goToPage(page - 1)}>Previous</Button>
					{#each { length: Math.min(totalPages, 5) } as _, i}
						{@const p = i + 1}
						<Button variant={p === page ? 'primary' : 'ghost'} size="sm" onclick={() => goToPage(p)}>{p}</Button>
					{/each}
					<Button variant="ghost" size="sm" disabled={page >= totalPages} onclick={() => goToPage(page + 1)}>Next</Button>
				</div>
			</div>
		{/if}
	{/if}
</AdminPage>

<style>
	.toolbar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.search-bar {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		transition: var(--transition-smooth);
	}

	.search-bar:focus-within {
		border-color: var(--color-primary-green);
		box-shadow: 0 0 0 3px rgba(39, 59, 9, 0.1);
	}

	.search-icon {
		display: flex;
		flex-shrink: 0;
		opacity: 0.4;
	}

	.search-bar input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.filters-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
		margin-bottom: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: var(--color-glass-bg);
	}

	:global(.filter-select) {
		min-width: 160px;
	}

	.filter-date {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		background: var(--color-glass-bg);
		color: var(--color-text);
		font-size: 0.85rem;
		font-family: inherit;
		min-width: 160px;
	}

	.payment-row {
		cursor: pointer;
	}

	.id-cell code {
		font-size: 0.8rem;
		opacity: 0.7;
		background: rgba(255,255,255,0.05);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.mono-cell {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.6;
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

	.pagination-buttons {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	@media (max-width: 768px) {
		.filters-bar {
			flex-direction: column;
		}
		:global(.filter-select) {
			width: 100%;
		}
	}
</style>
