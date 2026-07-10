<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, Users } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import CustomerStatusBadge from '$lib/admin/components/CustomerStatusBadge.svelte';

	interface CustomerListItem {
		id: string;
		name: string | null;
		email: string;
		display_name: string | null;
		image: string | null;
		account_status: string;
		email_verified: boolean;
		oauth_providers: string[];
		purchases_count: number;
		downloads_count: number;
		last_login_at: string | null;
		created_at: string;
	}

	interface CustomerListResponse {
		customers: CustomerListItem[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	}

	interface FilterOption {
		statuses: string[];
	}

	let customers = $state<CustomerListItem[]>([]);
	let total = $state(0);
	let page = $state(1);
	let totalPages = $state(0);
	let perPage = $state(20);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let statusFilter = $state('');
	let verifiedFilter = $state('');
	let oauthFilter = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let sort = $state('newest');

	let showFilters = $state(false);
	let statusOptions = $state<string[]>([]);
	let optionsLoaded = $state(false);

	async function loadCustomers() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams();
			if (search) params.set('search', search);
			if (statusFilter) params.set('status', statusFilter);
			if (verifiedFilter) params.set('emailVerified', verifiedFilter);
			if (oauthFilter) params.set('oauth', oauthFilter);
			if (dateFrom) params.set('dateFrom', dateFrom);
			if (dateTo) params.set('dateTo', dateTo);
			params.set('sort', sort);
			params.set('page', String(page));
			params.set('perPage', String(perPage));

			const result = await adminFetch<CustomerListResponse>(`/customers?${params}`);
			customers = result.customers;
			total = result.total;
			page = result.page;
			totalPages = result.totalPages;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load customers';
			}
		} finally {
			loading = false;
		}
	}

	async function loadOptions() {
		try {
			const result = await adminFetch<FilterOption>('/customers/options');
			statusOptions = result.statuses;
			optionsLoaded = true;
		} catch {
			// non-critical
		}
	}

	onMount(() => {
		loadOptions();
		loadCustomers();
	});

	function handleSearch() {
		page = 1;
		loadCustomers();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function goToPage(p: number) {
		page = p;
		loadCustomers();
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function clearFilters() {
		search = '';
		statusFilter = '';
		verifiedFilter = '';
		oauthFilter = '';
		dateFrom = '';
		dateTo = '';
		sort = 'newest';
		page = 1;
		loadCustomers();
	}

	function filteredCount(): number {
		let count = 0;
		if (search) count++;
		if (statusFilter) count++;
		if (verifiedFilter) count++;
		if (oauthFilter) count++;
		if (dateFrom || dateTo) count++;
		return count;
	}
</script>

<AdminPageHeader title="Customers" description="View and manage customer accounts">
	<Button variant="ghost" disabled>
		<Users size={16} />
		{total} Total
	</Button>
</AdminPageHeader>

<AdminPage {loading} {error} onRetry={loadCustomers}>
	<div class="toolbar">
		<div class="search-bar">
			<span class="search-icon"><Search size={16} /></span>
			<input
				type="text"
				bind:value={search}
				placeholder="Search by name or email..."
				onkeydown={handleKeydown}
				aria-label="Search customers"
			/>
		</div>
		<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)}>
			<SlidersHorizontal size={16} />
			Filters
			{#if filteredCount() > 0}
				<span class="filter-badge">{filteredCount()}</span>
			{/if}
		</Button>
	</div>

	{#if showFilters}
		<div class="filters-bar">
			<Input
				type="select"
				bind:value={statusFilter}
				options={[
					{ value: '', label: 'All Statuses' },
					...statusOptions.map(s => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))
				]}
				class="filter-select"
				onchange={loadCustomers}
			/>
			<Input
				type="select"
				bind:value={verifiedFilter}
				options={[
					{ value: '', label: 'All Verification' },
					{ value: 'true', label: 'Verified' },
					{ value: 'false', label: 'Not Verified' }
				]}
				class="filter-select"
				onchange={loadCustomers}
			/>
			<Input
				type="select"
				bind:value={oauthFilter}
				options={[
					{ value: '', label: 'All Auth Types' },
					{ value: 'none', label: 'Email Only' },
					{ value: 'google', label: 'Google' }
				]}
				class="filter-select"
				onchange={loadCustomers}
			/>
			<input
				type="date"
				bind:value={dateFrom}
				placeholder="From date"
				class="filter-date"
				onchange={loadCustomers}
			/>
			<input
				type="date"
				bind:value={dateTo}
				placeholder="To date"
				class="filter-date"
				onchange={loadCustomers}
			/>
			<Input
				type="select"
				bind:value={sort}
				options={[
					{ value: 'newest', label: 'Newest First' },
					{ value: 'oldest', label: 'Oldest First' },
					{ value: 'name', label: 'Name (A-Z)' },
					{ value: 'last_login', label: 'Last Login' },
					{ value: 'purchases', label: 'Most Purchases' }
				]}
				class="filter-select"
				onchange={loadCustomers}
			/>
			<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
		</div>
	{/if}

	{#if customers.length === 0}
		<AdminSection>
			<AdminEmptyState
				title="No customers found"
				message={search || statusFilter || verifiedFilter || oauthFilter
					? 'Try adjusting your search or filters.'
					: 'Customers will appear here once users sign up.'}
			/>
		</AdminSection>
	{:else}
		<AdminTableContainer>
			<table>
				<thead>
					<tr>
						<th>Customer</th>
						<th>Status</th>
						<th>Verified</th>
						<th>Auth</th>
						<th>Purchases</th>
						<th>Downloads</th>
						<th>Last Login</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each customers as customer}
						<tr
							class="customer-row"
							onclick={() => window.location.href = `/admin/customers/${customer.id}`}
							role="link"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/admin/customers/${customer.id}`)}
						>
							<td>
								<div class="customer-info">
									<div class="customer-avatar">
										{customer.display_name || customer.name
											? (customer.display_name || customer.name)!.charAt(0).toUpperCase()
											: customer.email.charAt(0).toUpperCase()}
									</div>
									<div>
										<div class="customer-name">{customer.display_name || customer.name || 'Unnamed'}</div>
										<div class="customer-email">{customer.email}</div>
									</div>
								</div>
							</td>
							<td><CustomerStatusBadge status={customer.account_status} /></td>
							<td>
								{#if customer.email_verified}
									<span class="verified yes">Yes</span>
								{:else}
									<span class="verified no">No</span>
								{/if}
							</td>
							<td class="auth-cell">
								{#if customer.oauth_providers.includes('google')}
									<span class="oauth-badge google">Google</span>
								{:else}
									<span class="oauth-none">Email</span>
								{/if}
							</td>
							<td class="num-cell">{customer.purchases_count}</td>
							<td class="num-cell">{customer.downloads_count}</td>
							<td class="date-cell">{formatDate(customer.last_login_at)}</td>
							<td class="date-cell">{formatDate(customer.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</AdminTableContainer>

		{#if totalPages > 1}
			<div class="pagination">
				<span class="pagination-info">Page {page} of {totalPages} ({total} customers)</span>
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

	.filter-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		font-size: 0.7rem;
		font-weight: 700;
		border-radius: 50%;
		background: var(--color-accent-green);
		color: var(--color-bg-dark);
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

	.customer-row {
		cursor: pointer;
	}

	.customer-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.customer-avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.customer-name {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.customer-email {
		font-size: 0.8rem;
		opacity: 0.55;
	}

	.verified {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.verified.yes {
		color: #5a7a1a;
	}

	.verified.no {
		opacity: 0.4;
	}

	.auth-cell {
		font-size: 0.8rem;
	}

	.oauth-badge {
		display: inline-flex;
		padding: 0.1rem 0.45rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.oauth-badge.google {
		background: rgba(66, 133, 244, 0.12);
		color: #4285f4;
	}

	.oauth-none {
		opacity: 0.45;
	}

	.num-cell {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
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
