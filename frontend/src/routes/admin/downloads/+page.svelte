<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, Download } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import DownloadStatusBadge from '$lib/admin/components/DownloadStatusBadge.svelte';

	interface DownloadListItem {
		id: string;
		token: string;
		purchase_id: string;
		product_name: string;
		customer_name: string | null;
		customer_email: string;
		status: string;
		created_at: string;
		expires_at: string;
		tokens_count: number;
	}

	interface DownloadListResponse {
		downloads: DownloadListItem[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	}

	interface FilterOption {
		products: { id: string; name: string }[];
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
	let productOptions = $state<{ id: string; name: string }[]>([]);
	let optionsLoaded = $state(false);

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

	async function loadOptions() {
		try {
			const result = await adminFetch<FilterOption>('/downloads/options');
			productOptions = result.products;
			optionsLoaded = true;
		} catch {
			// non-critical
		}
	}

	onMount(() => {
		loadOptions();
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
		if (!dateStr) return '—';
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

<AdminPageHeader title="Downloads" description="View and manage download tokens">
	<Button variant="ghost" disabled>
		<Download size={16} />
		{total} Tokens
	</Button>
</AdminPageHeader>

<AdminPage {loading} {error} onRetry={loadDownloads}>
	<div class="toolbar">
		<div class="search-bar">
			<span class="search-icon"><Search size={16} /></span>
			<input
				type="text"
				bind:value={search}
				placeholder="Search by customer, product, or token..."
				onkeydown={handleKeydown}
				aria-label="Search downloads"
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
					{ value: 'active', label: 'Active' },
					{ value: 'expired', label: 'Expired' }
				]}
				class="filter-select"
				onchange={loadDownloads}
			/>
			<Input
				type="select"
				bind:value={productFilter}
				options={[
					{ value: '', label: 'All Products' },
					...productOptions.map(p => ({ value: p.id, label: p.name }))
				]}
				class="filter-select"
				onchange={loadDownloads}
			/>
			<Input
				type="select"
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
		</div>
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
		<AdminTableContainer>
			<table>
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
							<td>{dl.product_name}</td>
							<td>
								<div class="customer-info">
									<span class="customer-name">{dl.customer_name || 'Guest'}</span>
									<span class="customer-email">{dl.customer_email}</span>
								</div>
							</td>
							<td class="mono-small">{dl.token.substring(0, 16)}...</td>
							<td><DownloadStatusBadge status={dl.status} /></td>
							<td class="num-cell">{dl.tokens_count}</td>
							<td class="date-cell">{formatDate(dl.expires_at)}</td>
							<td class="date-cell">{formatDate(dl.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</AdminTableContainer>

		{#if totalPages > 1}
			<div class="pagination">
				<span class="pagination-info">Page {page} of {totalPages} ({total} downloads)</span>
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

	.download-row {
		cursor: pointer;
	}

	.customer-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.customer-name {
		font-weight: 600;
		font-size: 0.9rem;
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
