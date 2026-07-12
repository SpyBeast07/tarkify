<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, Trash2, Archive, CheckSquare, Square } from '@lucide/svelte';
	import {
		type RecordType,
		type CommStatus,
		type ListParams,
		listRecords,
		archiveRecord,
		deleteRecord
	} from '$lib/admin/api/communication';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from './AdminPage.svelte';
	import AdminPageHeader from './AdminPageHeader.svelte';
	import AdminTableContainer from './AdminTableContainer.svelte';
	import AdminEmptyState from './AdminEmptyState.svelte';
	import CommunicationStatusBadge from './CommunicationStatusBadge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	interface Props {
		recordType: RecordType;
		title: string;
		description?: string;
		searchPlaceholder?: string;
		statusOptions?: { value: CommStatus | ''; label: string }[];
		// Returns display columns (excluding status) for each row
		rowFields: (r: any) => { label: string; value: string; mono?: boolean }[];
		rowHref: (r: any) => string;
	}

	let {
		recordType,
		title,
		description = '',
		searchPlaceholder = 'Search...',
		statusOptions = [
			{ value: '', label: 'All Statuses' },
			{ value: 'NEW', label: 'New' },
			{ value: 'READ', label: 'Read' },
			{ value: 'REPLIED', label: 'Replied' },
			{ value: 'ARCHIVED', label: 'Archived' }
		],
		rowFields,
		rowHref
	}: Props = $props();

	let items = $state<any[]>([]);
	let total = $state(0);
	let page = $state(1);
	let totalPages = $state(0);
	let perPage = $state(20);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let statusFilter = $state<CommStatus | ''>('');
	let sort = $state<'newest' | 'oldest' | 'status' | 'updated'>('newest');
	let archivedFilter = $state<'true' | 'false' | ''>('');
	let showFilters = $state(false);

	let selected = $state<Set<string>>(new Set());
	let bulkLoading = $state(false);
	let bulkError = $state<string | null>(null);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	async function load() {
		error = null;
		const params: ListParams = {
			search: search || undefined,
			status: statusFilter || undefined,
			archived: (archivedFilter || undefined) as 'true' | 'false' | undefined,
			sort,
			page,
			perPage
		};
		try {
			const result = await listRecords<any>(recordType, params);
			items = result.items;
			total = result.total;
			page = result.page;
			totalPages = result.totalPages;
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : `Failed to load ${title}`;
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function onSearchInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			page = 1;
			load();
		}, 300);
	}

	function goToPage(p: number) {
		page = p;
		load();
	}

	function clearFilters() {
		search = '';
		statusFilter = '';
		sort = 'newest';
		archivedFilter = '';
		page = 1;
		if (searchTimer) clearTimeout(searchTimer);
		load();
	}

	function toggleSelect(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	function toggleSelectAll() {
		if (selected.size === items.length) selected = new Set();
		else selected = new Set(items.map((i) => i.id));
	}

	async function bulkArchive() {
		bulkLoading = true;
		bulkError = null;
		try {
			for (const id of selected) await archiveRecord(recordType, id);
			selected = new Set();
			await load();
		} catch (err) {
			bulkError = err instanceof AdminApiError ? err.message : 'Bulk archive failed';
		} finally {
			bulkLoading = false;
		}
	}

	async function bulkDelete() {
		if (!confirm(`Delete ${selected.size} record(s)? This cannot be undone.`)) return;
		bulkLoading = true;
		bulkError = null;
		try {
			for (const id of selected) await deleteRecord(recordType, id);
			selected = new Set();
			await load();
		} catch (err) {
			bulkError = err instanceof AdminApiError ? err.message : 'Bulk delete failed';
		} finally {
			bulkLoading = false;
		}
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric'
		});
	}
</script>

<AdminPageHeader {title} {description}>
	<Button variant="ghost" disabled>{total} Records</Button>
</AdminPageHeader>

<AdminPage {loading} {error} onRetry={load}>
	{#if bulkError}
		<p class="bulk-error" role="alert">{bulkError}</p>
	{/if}

	<div class="toolbar">
		<div class="search-bar">
			<span class="search-icon"><Search size={16} /></span>
			<input
				type="text"
				bind:value={search}
				placeholder={searchPlaceholder}
				oninput={onSearchInput}
				aria-label={`Search ${title}`}
			/>
		</div>
		<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)} class="btn-with-icon">
			<SlidersHorizontal size={16} />
			Filters
		</Button>
	</div>

	{#if showFilters}
		<div class="filters-bar">
			<Input
				type="select"
				bind:value={statusFilter}
				options={statusOptions}
				class="filter-select"
				onchange={load}
			/>
			<Input
				type="select"
				bind:value={archivedFilter}
				options={[
					{ value: '', label: 'All Records' },
					{ value: 'false', label: 'Active Only' },
					{ value: 'true', label: 'Archived Only' }
				]}
				class="filter-select"
				onchange={load}
			/>
			<Input
				type="select"
				bind:value={sort}
				options={[
					{ value: 'newest', label: 'Newest First' },
					{ value: 'oldest', label: 'Oldest First' },
					{ value: 'status', label: 'By Status' },
					{ value: 'updated', label: 'Recently Updated' }
				]}
				class="filter-select"
				onchange={load}
			/>
			<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
		</div>
	{/if}

	{#if selected.size > 0}
		<div class="bulk-bar" role="status">
			<span>{selected.size} selected</span>
			<Button variant="secondary" size="sm" disabled={bulkLoading} onclick={bulkArchive} class="btn-with-icon">
				<Archive size={14} />
				Archive
			</Button>
			<Button variant="danger" size="sm" disabled={bulkLoading} onclick={bulkDelete} class="btn-with-icon">
				<Trash2 size={14} />
				Delete
			</Button>
			<Button variant="ghost" size="sm" disabled={bulkLoading} onclick={() => (selected = new Set())}>Clear</Button>
		</div>
	{/if}

	{#if items.length === 0}
		<AdminEmptyState title={`No ${title.toLowerCase()} found`} message={search || statusFilter || archivedFilter ? 'Try adjusting your search or filters.' : 'Records will appear here as they arrive.'} />
	{:else}
		<AdminTableContainer>
			<table>
				<thead>
					<tr>
						<th class="col-select">
							<button class="select-all" onclick={toggleSelectAll} aria-label="Select all">
								{#if selected.size === items.length && items.length > 0}
									<CheckSquare size={16} />
								{:else}
									<Square size={16} />
								{/if}
							</button>
						</th>
						<th>Record</th>
						<th>Status</th>
						<th>Tags</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each items as r (r.id)}
						<tr
							class="record-row"
							onclick={() => (window.location.href = rowHref(r))}
							role="link"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && (window.location.href = rowHref(r))}
						>
							<td class="col-select" onclick={(e) => e.stopPropagation()}>
								<button class="select-all" onclick={() => toggleSelect(r.id)} aria-label={`Select record`}>
									{#if selected.has(r.id)}
										<CheckSquare size={16} />
									{:else}
										<Square size={16} />
									{/if}
								</button>
							</td>
							<td>
								<div class="record-summary">
									{#each rowFields(r) as field}
										<div class="record-field">
											{#if field.mono}
												<code class="mono-small">{field.value}</code>
											{:else}
												<span class="field-value">{field.value}</span>
											{/if}
											{#if field !== rowFields(r)[rowFields(r).length - 1]}
												<span class="field-sep">·</span>
											{/if}
										</div>
									{/each}
									{#if (r.note_count ?? 0) > 0 || (r.tag_count ?? 0) > 0}
										<div class="record-meta">
											{#if r.note_count > 0}<span>{r.note_count} notes</span>{/if}
											{#if r.tag_count > 0}<span>{r.tag_count} tags</span>{/if}
										</div>
									{/if}
								</div>
							</td>
							<td><CommunicationStatusBadge status={r.status} /></td>
							<td class="num-cell">{r.tag_count ?? 0}</td>
							<td class="date-cell">{formatDate(r.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</AdminTableContainer>

		{#if totalPages > 1}
			<div class="pagination">
				<span class="pagination-info">Page {page} of {totalPages} ({total} records)</span>
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
	.bulk-error {
		color: #ef4444;
		font-size: 0.85rem;
		margin: 0 0 1rem;
	}

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

	.bulk-bar {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
		padding: 0.5rem 1rem;
		border-radius: 10px;
		background: rgba(39, 59, 9, 0.1);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.record-row {
		cursor: pointer;
	}

	.col-select {
		width: 40px;
	}

	.select-all {
		display: inline-flex;
		border: none;
		background: none;
		cursor: pointer;
		color: var(--color-text);
		opacity: 0.6;
		padding: 0;
	}

	.select-all:hover {
		opacity: 1;
	}

	.record-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.5rem;
		align-items: baseline;
	}

	.record-field {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
	}

	.field-value {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.field-sep {
		opacity: 0.3;
	}

	.mono-small {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.record-meta {
		display: flex;
		gap: 0.5rem;
		width: 100%;
		font-size: 0.75rem;
		opacity: 0.5;
		margin-top: 0.2rem;
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
