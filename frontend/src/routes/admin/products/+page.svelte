<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Search, SlidersHorizontal } from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ProductStatusBadge from '$lib/admin/components/ProductStatusBadge.svelte';

	interface ProductListItem {
		id: string;
		slug: string;
		name: string;
		short_description: string | null;
		price: number;
		currency: string;
		status: string;
		visibility: string;
		category: string;
		version: string;
		download_key: string | null;
		created_at: string;
		updated_at: string;
	}

	interface ProductListResponse {
		products: ProductListItem[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	}

	let products = $state<ProductListItem[]>([]);
	let total = $state(0);
	let page = $state(1);
	let totalPages = $state(0);
	let perPage = $state(20);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let statusFilter = $state('');
	let visibilityFilter = $state('');
	let categoryFilter = $state('');
	let sort = $state('newest');

	let showFilters = $state(false);
	let categories = $state<string[]>([]);

	async function loadProducts() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams();
			if (search) params.set('search', search);
			if (statusFilter) params.set('status', statusFilter);
			if (visibilityFilter) params.set('visibility', visibilityFilter);
			if (categoryFilter) params.set('category', categoryFilter);
			params.set('sort', sort);
			params.set('page', String(page));
			params.set('perPage', String(perPage));

			const result = await adminFetch<ProductListResponse>(`/products?${params}`);
			products = result.products;
			total = result.total;
			page = result.page;
			totalPages = result.totalPages;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load products';
			}
		} finally {
			loading = false;
		}
	}

	async function loadCategories() {
		try {
			const result = await adminFetch<{ categories: string[] }>('/products/categories');
			categories = result.categories;
		} catch {
			// non-critical
		}
	}

	onMount(() => {
		loadCategories();
		loadProducts();
	});

	function handleSearch() {
		page = 1;
		loadProducts();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function goToPage(p: number) {
		page = p;
		loadProducts();
	}

	function formatPrice(price: number, currency: string): string {
		try {
			return new Intl.NumberFormat('en-IN', {
				style: 'currency',
				currency: currency || 'INR',
				maximumFractionDigits: 0
			}).format(price);
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
		visibilityFilter = '';
		categoryFilter = '';
		sort = 'newest';
		page = 1;
		loadProducts();
	}
</script>

<AdminPageHeader title="Products" description="Manage your product catalog">
	<Button href="/admin/products/new" variant="primary">
		<Plus size={16} />
		New Product
	</Button>
</AdminPageHeader>

<AdminPage {loading} {error} onRetry={loadProducts}>
	<div class="products-toolbar">
		<div class="search-bar">
		<span class="search-icon-wrap"><Search size={16} /></span>
			<input
				type="text"
				bind:value={search}
				placeholder="Search by name or slug..."
				onkeydown={handleKeydown}
				aria-label="Search products"
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
					{ value: '', label: 'All Status' },
					{ value: 'draft', label: 'Draft' },
					{ value: 'published', label: 'Published' },
					{ value: 'archived', label: 'Archived' }
				]}
				class="filter-select"
				onchange={loadProducts}
			/>
			<Input
				type="select"
				bind:value={visibilityFilter}
				options={[
					{ value: '', label: 'All Visibility' },
					{ value: 'public', label: 'Public' },
					{ value: 'hidden', label: 'Hidden' }
				]}
				class="filter-select"
				onchange={loadProducts}
			/>
			<Input
				type="select"
				bind:value={categoryFilter}
				options={[
					{ value: '', label: 'All Categories' },
					...categories.map(c => ({ value: c, label: c }))
				]}
				class="filter-select"
				onchange={loadProducts}
			/>
			<Input
				type="select"
				bind:value={sort}
				options={[
					{ value: 'newest', label: 'Newest First' },
					{ value: 'oldest', label: 'Oldest First' },
					{ value: 'updated', label: 'Recently Updated' },
					{ value: 'price', label: 'Price (Low)' },
					{ value: 'name', label: 'Name (A-Z)' }
				]}
				class="filter-select"
				onchange={loadProducts}
			/>
			<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
		</div>
	{/if}

	{#if products.length === 0}
		<AdminSection>
			<AdminEmptyState
				title="No products found"
				message={search || statusFilter || visibilityFilter || categoryFilter
					? 'Try adjusting your search or filters.'
					: 'Get started by creating your first product.'}
			/>
		</AdminSection>
	{:else}
		<AdminTableContainer>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Slug</th>
						<th>Price</th>
						<th>Status</th>
						<th>Visibility</th>
						<th>Category</th>
						<th>Version</th>
						<th>Last Updated</th>
					</tr>
				</thead>
				<tbody>
					{#each products as product}
						<tr class="product-row" onclick={() => window.location.href = `/admin/products/${product.id}`} role="link" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/admin/products/${product.id}`)}>
							<td class="product-name-cell">
								<div class="product-info">
									<div class="product-avatar">
										{product.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<div class="product-name">{product.name}</div>
										{#if product.short_description}
											<div class="product-desc">{product.short_description}</div>
										{/if}
									</div>
								</div>
							</td>
							<td><code class="slug">{product.slug}</code></td>
							<td class="price-cell">{formatPrice(product.price, product.currency)}</td>
							<td><ProductStatusBadge status={product.status} /></td>
							<td>{product.visibility}</td>
							<td><span class="category-tag">{product.category}</span></td>
							<td><span class="version-badge">v{product.version}</span></td>
							<td class="date-cell">{formatDate(product.updated_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</AdminTableContainer>

		{#if totalPages > 1}
			<div class="pagination">
				<span class="pagination-info">
					Page {page} of {totalPages} ({total} products)
				</span>
				<div class="pagination-buttons">
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
				</div>
			</div>
		{/if}
	{/if}
</AdminPage>

<style>
	.products-toolbar {
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

	.search-icon-wrap {
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

	.product-row {
		cursor: pointer;
	}

	.product-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.product-avatar {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: var(--color-primary-green);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.product-name {
		font-weight: 600;
	}

	.product-desc {
		font-size: 0.8rem;
		opacity: 0.6;
		line-height: 1.3;
		max-width: 250px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.slug {
		font-size: 0.8rem;
		opacity: 0.7;
		background: rgba(255,255,255,0.05);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.price-cell {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.category-tag {
		font-size: 0.8rem;
		padding: 0.15rem 0.5rem;
		background: rgba(39, 59, 9, 0.08);
		border-radius: 6px;
	}

	.version-badge {
		font-size: 0.8rem;
		padding: 0.15rem 0.4rem;
		background: rgba(255,255,255,0.05);
		border-radius: 4px;
		font-family: var(--font-accent);
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
