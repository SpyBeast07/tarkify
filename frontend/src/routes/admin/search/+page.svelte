<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Search } from '@lucide/svelte';
	import { DebouncedNavigation } from '$lib/utils/navigation';
	import { searchGlobal, getSearchOptions } from '$lib/admin/api/search';
	import type { SearchModule, SearchResponse, SearchResult } from '$lib/admin/types/search';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminLoading from '$lib/admin/components/AdminLoading.svelte';
	import AdminError from '$lib/admin/components/AdminError.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import SearchFilterBar from '$lib/admin/components/SearchFilterBar.svelte';
	import SearchResultCard from '$lib/admin/components/SearchResultCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	let query = $state('');
	let module = $state<SearchModule | 'all'>('all');
	let sort = $state<'relevance' | 'newest'>('relevance');
	let pageNum = $state(1);
	let perPage = $state(20);

	let loading = $state(false);
	let error = $state<string | null>(null);
	let results = $state<SearchResult[]>([]);
	let total = $state(0);
	let totalPages = $state(0);
	let counts: Record<SearchModule, number> = $state({} as Record<SearchModule, number>);
	let optionsLoading = $state(true);
	let moduleOptions: { value: SearchModule; label: string }[] = $state([]);

	const debouncedNav = new DebouncedNavigation();

	$effect(() => {
		const urlParams = new URLSearchParams($page.url.search);
		const q = urlParams.get('q') ?? '';
		const m = (urlParams.get('module') as SearchModule | 'all') ?? 'all';
		const s = (urlParams.get('sort') as 'relevance' | 'newest') ?? 'relevance';
		const p = parseInt(urlParams.get('page') ?? '1', 10);

		query = q;
		module = m;
		sort = s;
		pageNum = p;

		if (q) {
			loadResults();
		}
	});

	async function loadOptions() {
		optionsLoading = true;
		try {
			const opts = await getSearchOptions();
			moduleOptions = opts.modules;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load search options';
		} finally {
			optionsLoading = false;
		}
	}

	async function loadResults() {
		if (!query.trim()) {
			results = [];
			total = 0;
			totalPages = 0;
			counts = {} as Record<SearchModule, number>;
			return;
		}
		loading = true;
		error = null;
		try {
			const resp = await searchGlobal(query, module, pageNum, perPage, sort);
			results = resp.results;
			total = resp.total;
			totalPages = resp.totalPages;
			counts = resp.counts;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Search failed';
			results = [];
			total = 0;
			totalPages = 0;
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		pageNum = 1;
		debouncedNav.navigate(`/admin/search?q=${encodeURIComponent(query)}&module=${module}&sort=${sort}&page=1`, 100);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function goToPage(p: number) {
		pageNum = p;
		debouncedNav.navigate(
			`/admin/search?q=${encodeURIComponent(query)}&module=${module}&sort=${sort}&page=${p}`,
			100
		);
	}

	onMount(() => {
		loadOptions();
	});

	function getTotalCount(): number {
		return Object.values(counts).reduce((a, b) => a + (b || 0), 0);
	}
</script>

<svelte:head>
	<title>Global Search | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Search" description="Find anything across the Tarkify platform">
		{#if query && !loading}
			<span class="result-count-badge">{getTotalCount()} results</span>
		{/if}
	</AdminPageHeader>

	<div class="search-bar-container">
		<AdminInput
			type="text"
			bind:value={query}
			placeholder="Search products, orders, customers..."
			onkeydown={handleKeydown}
			aria-label="Search query"
			icon={Search}
		/>
	</div>

	<AdminPage {loading} {error} onRetry={loadResults}>
		{#if !query}
			<AdminSection>
				<AdminEmptyState
					title="Enter a search query"
					message="Type above to search across products, orders, customers, and more."
				/>
			</AdminSection>
		{:else if loading && !results.length}
			<AdminSection>
				<AdminLoading variant="card" count={5} />
			</AdminSection>
		{:else}
			{#if results.length === 0}
				<AdminSection>
					<AdminEmptyState
						title="No results found"
						message={`No matches for "${query}". Try a different search term.`}
					/>
				</AdminSection>
			{:else}
				<SearchFilterBar
					bind:module
					bind:sort
					modules={moduleOptions}
					onModuleChange={() => handleSearch()}
					onSortChange={() => handleSearch()}
				/>

				<AdminSection>
					<div class="results-grid" role="list" aria-label="Search results">
						{#each results as result (result.id)}
							<SearchResultCard {result} />
						{/each}
					</div>
				</AdminSection>

				{#if totalPages > 1}
					<div class="pagination">
						<span class="pagination-info">Page {pageNum} of {totalPages} ({total} total)</span>
						<AdminButtonGroup align="right" class="pagination-buttons">
							<Button variant="ghost" size="sm" disabled={pageNum <= 1} onclick={() => goToPage(pageNum - 1)}>
								Previous
							</Button>
							{#each { length: Math.min(totalPages, 5) } as _, i}
								{@const p = i + 1}
								<Button variant={p === pageNum ? 'primary' : 'ghost'} size="sm" onclick={() => goToPage(p)}>
									{p}
								</Button>
							{/each}
							<Button variant="ghost" size="sm" disabled={pageNum >= totalPages} onclick={() => goToPage(pageNum + 1)}>
								Next
							</Button>
						</AdminButtonGroup>
					</div>
				{/if}
			{/if}
		{/if}
	</AdminPage>
</AdminPageContainer>

<style>
	.search-bar-container {
		margin-bottom: 1.5rem;
		max-width: 600px;
	}

	.result-count-badge {
		font-size: 0.85rem;
		font-weight: 500;
		padding: 0.35rem 0.75rem;
		background: var(--color-glass-bg);
		border-radius: 999px;
		opacity: 0.7;
	}

	.results-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
</style>