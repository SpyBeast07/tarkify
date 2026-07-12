<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, Download } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import DownloadStatusBadge from '$lib/admin/components/DownloadStatusBadge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminToolbar from '$lib/admin/components/AdminToolbar.svelte';
	import AdminFilterBar from '$lib/admin/components/AdminFilterBar.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminSelect from '$lib/admin/components/AdminSelect.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	interface DownloadListItem {
		id: string;
		token: string;
		purchase_id: string;
		product_name: string;
		customer_email: string;
		customer_name: string | null;
		expires_at: string;
		downloads_count: number;
		created_at: string;
		is_expired: boolean;
	}

	interface DownloadListResponse {
		downloads: DownloadListItem[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	}

	let downloads = $state<DownloadListItem[]>([]);
	let total = $state(0);
	let page = $state(1);
	let totalPages = $state(0);
	let perPage = $state(20);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let statusFilter = $state('');
	let productFilter = $state('');
	let sort = $state('newest');

	let showFilters = $state(false);
	let productOptions = $state<Array<{ id: string; name: string }>>([]);

	async function loadDownloads() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams();
			if (search) params.set('search', search);
			if (statusFilter) params.set('status', statusFilter);
			if (productFilter) params.set('product', productFilter);
			params.set('sort', sort);
			params.set('page', String(page));
			params.set('perPage', String(perPage));

			const result = await adminFetch<DownloadListResponse>(`/downloads?${params}`);
			downloads = result.downloads;
			total = result.total;
			page = result.page;
			totalPages = result.totalPages;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load downloads';
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
		loadDownloads();
	});

	function handleSearch() {
		page = 1;
		loadDownloads();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function goToPage(p: number) {
		page = p;
		loadDownloads();
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function clearFilters() {
		search = '';
		statusFilter = '';
		productFilter = '';
		sort = 'newest';
		page = 1;
		loadDownloads();
	}
</script>

<svelte:head>
	<title>Downloads | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Downloads" description="View and manage active entitlement download tokens">
		<Button variant="ghost" disabled>
			<Download size={16} />
			{total} Tokens
		</Button>
	</AdminPageHeader>

	<AdminPage {loading} {error} onRetry={loadDownloads}>
		<AdminToolbar>
			<div class="search-bar-wrapper">
				<AdminInput
					type="text"
					bind:value={search}
					placeholder="Search by customer, product, or token..."
					onkeydown={handleKeydown}
					aria-label="Search downloads"
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
						{ value: 'active', label: 'Active' },
						{ value: 'expired', label: 'Expired' }
					]}
					class="filter-select"
					onchange={loadDownloads}
				/>
				<AdminSelect
					bind:value={productFilter}
					options={[
						{ value: '', label: 'All Products' },
						...productOptions.map(p => ({ value: p.id, label: p.name }))
					]}
					class="filter-select"
					onchange={loadDownloads}
				/>
				<AdminSelect
					bind:value={sort}
					options={[
						{ value: 'newest', label: 'Newest First' },
						{ value: 'oldest', label: 'Oldest First' },
						{ value: 'expires', label: 'Expiring Soon' },
						{ value: 'downloads', label: 'Most Tokens' }
					]}
					class="filter-select"
					onchange={loadDownloads}
				/>
				<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
			</AdminFilterBar>
		{/if}

		{#if downloads.length === 0}
			<AdminSection>
				<AdminEmptyState
					title="No downloads found"
					message={search || statusFilter || productFilter
						? 'Try adjusting your search or filters.'
						: 'Download tokens will appear here once customers make purchases.'}
				/>
			</AdminSection>
		{:else}
			<AdminTable>
				<thead>
					<tr>
						<th>Product</th>
						<th>Customer</th>
						<th>Token</th>
						<th>Status</th>
						<th>Tokens</th>
						<th>Expires</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each downloads as dl}
						<tr
							class="download-row"
							onclick={() => window.location.href = `/admin/downloads/${dl.id}`}
							role="link"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/admin/downloads/${dl.id}`)}
						>
							<td class="product-cell-bold">{dl.product_name}</td>
							<td>
								<div class="customer-info">
									<span class="customer-name">{dl.customer_name || 'Unnamed'}</span>
									<span class="customer-email">{dl.customer_email}</span>
								</div>
							</td>
							<td class="mono-small">{dl.token.substring(0, 16)}...</td>
							<td><DownloadStatusBadge status={dl.is_expired ? 'expired' : 'active'} /></td>
							<td class="num-cell">{dl.downloads_count}</td>
							<td class="date-cell">{formatDate(dl.expires_at)}</td>
							<td class="date-cell">{formatDate(dl.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</AdminTable>

			{#if totalPages > 1}
				<div class="pagination">
					<span class="pagination-info">
						Page {page} of {totalPages} ({total} tokens)
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

	.download-row {
		cursor: pointer;
	}

	.product-cell-bold {
		font-weight: 600;
		color: var(--color-text);
	}

	.customer-info {
		display: flex;
		flex-direction: column;
	}

	.customer-name {
		font-weight: 500;
	}

	.customer-email {
		font-size: 0.8rem;
		opacity: 0.55;
	}

	.mono-small {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.7;
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
	}
</style>
