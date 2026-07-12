<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, Users } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import CustomerStatusBadge from '$lib/admin/components/CustomerStatusBadge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminToolbar from '$lib/admin/components/AdminToolbar.svelte';
	import AdminFilterBar from '$lib/admin/components/AdminFilterBar.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminSelect from '$lib/admin/components/AdminSelect.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	interface CustomerListItem {
		id: string;
		email: string;
		name: string | null;
		display_name: string | null;
		email_verified: boolean;
		account_status: string;
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

	async function loadCustomers() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams();
			if (search) params.set('search', search);
			if (statusFilter) params.set('status', statusFilter);
			if (verifiedFilter) params.set('verified', verifiedFilter);
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

	async function loadMetadata() {
		try {
			const result = await adminFetch<{ statuses: string[] }>('/customers/metadata');
			statusOptions = result.statuses;
		} catch {
			// non-critical
		}
	}

	onMount(() => {
		loadMetadata();
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

<svelte:head>
	<title>Customers | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Customers" description="View and manage customer accounts">
		<Button variant="ghost" disabled>
			<Users size={16} />
			{total} Total
		</Button>
	</AdminPageHeader>

	<AdminPage {loading} {error} onRetry={loadCustomers}>
		<AdminToolbar>
			<div class="search-bar-wrapper">
				<AdminInput
					type="text"
					bind:value={search}
					placeholder="Search by name or email..."
					onkeydown={handleKeydown}
					aria-label="Search customers"
					icon={Search}
				/>
			</div>
			<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)}>
				<SlidersHorizontal size={16} />
				Filters
				{#if filteredCount() > 0}
					<span class="filter-badge">{filteredCount()}</span>
				{/if}
			</Button>
		</AdminToolbar>

		{#if showFilters}
			<AdminFilterBar>
				<AdminSelect
					bind:value={statusFilter}
					options={[
						{ value: '', label: 'All Statuses' },
						...statusOptions.map(s => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))
					]}
					class="filter-select"
					onchange={loadCustomers}
				/>
				<AdminSelect
					bind:value={verifiedFilter}
					options={[
						{ value: '', label: 'All Verification' },
						{ value: 'true', label: 'Verified' },
						{ value: 'false', label: 'Not Verified' }
					]}
					class="filter-select"
					onchange={loadCustomers}
				/>
				<AdminSelect
					bind:value={oauthFilter}
					options={[
						{ value: '', label: 'All Auth Types' },
						{ value: 'none', label: 'Email Only' },
						{ value: 'google', label: 'Google' }
					]}
					class="filter-select"
					onchange={loadCustomers}
				/>
				<AdminInput
					type="date"
					bind:value={dateFrom}
					class="filter-date"
					onchange={loadCustomers}
					aria-label="From Date"
				/>
				<AdminInput
					type="date"
					bind:value={dateTo}
					class="filter-date"
					onchange={loadCustomers}
					aria-label="To Date"
				/>
				<AdminSelect
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
			</AdminFilterBar>
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
			<AdminTable>
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
									<div class="customer-details">
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
			</AdminTable>

			{#if totalPages > 1}
				<div class="pagination">
					<span class="pagination-info">
						Page {page} of {totalPages} ({total} customers)
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

	.filter-badge {
		background: var(--color-accent-green);
		color: #fff;
		border-radius: 999px;
		font-size: 0.7rem;
		padding: 0.05rem 0.4rem;
		margin-left: 0.25rem;
	}

	:global(.filter-select) {
		min-width: 160px;
	}

	:global(.filter-date.admin-input-group) {
		min-width: 130px;
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
		background: rgba(123, 144, 75, 0.1);
		border: 1px solid var(--color-glass-border);
		color: var(--color-accent-green);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.customer-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.customer-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color-text);
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
