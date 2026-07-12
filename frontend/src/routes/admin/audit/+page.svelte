<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Search,
		SlidersHorizontal,
		Download,
		List,
		History,
		Activity,
		CalendarClock,
		AlertTriangle,
		CheckCircle2,
		Users
	} from '@lucide/svelte';
	import {
		getAuditLogs,
		getAuditOptions,
		getAuditStats,
		AdminApiError
	} from '$lib/admin/api/audit';
	import type { AuditListParams, AuditStats, AuditOptions } from '$lib/admin/types/audit';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import DashboardStatCard from '$lib/admin/components/DashboardStatCard.svelte';
	import AuditEventBadge from '$lib/admin/components/AuditEventBadge.svelte';
	import AuditTimeline from '$lib/admin/components/AuditTimeline.svelte';
	import AuditFilterBar from '$lib/admin/components/AuditFilterBar.svelte';
	import AuditExportDialog from '$lib/admin/components/AuditExportDialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminToolbar from '$lib/admin/components/AdminToolbar.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	let params = $state<AuditListParams>({
		search: '',
		event: '',
		module: undefined,
		actor: '',
		target: '',
		dateFrom: '',
		dateTo: '',
		sort: 'newest',
		page: 1,
		perPage: 20
	});

	let events = $state<any[]>([]);
	let total = $state(0);
	let totalPages = $state(1);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let stats = $state<AuditStats | null>(null);
	let options = $state<AuditOptions | null>(null);
	let viewMode = $state<'table' | 'timeline'>('table');
	let showFilters = $state(false);
	let exportOpen = $state(false);

	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	const activeFilterCount = $derived(
		(params.event ? 1 : 0) +
			(params.module ? 1 : 0) +
			(params.actor ? 1 : 0) +
			(params.target ? 1 : 0) +
			(params.status ? 1 : 0) +
			(params.dateFrom || params.dateTo ? 1 : 0)
	);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await getAuditLogs(params);
			events = res.events;
			total = res.total;
			totalPages = res.totalPages;
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load audit logs';
		} finally {
			loading = false;
		}
	}

	function reload(resetPage = true) {
		if (resetPage) params.page = 1;
		load();
	}

	function onSearchInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => reload(), 400);
	}

	function onFiltersApply() {
		reload();
	}

	function onFiltersClear() {
		params = {
			search: params.search,
			event: '',
			module: undefined,
			actor: '',
			target: '',
			dateFrom: '',
			dateTo: '',
			sort: 'newest',
			page: 1,
			perPage: params.perPage
		};
		reload(false);
	}

	function goToPage(p: number) {
		params.page = p;
		load();
	}

	function openDetail(id: string) {
		goto(`/admin/audit/${id}`);
	}

	function formatDateTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(async () => {
		try {
			const [s, o] = await Promise.all([getAuditStats(), getAuditOptions()]);
			stats = s;
			options = o;
		} catch {
			// non-critical
		}
		load();
	});
</script>

<svelte:head>
	<title>Audit Logs | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Audit Logs" description="Complete activity trail across the platform.">
		<Button variant="ghost" size="sm" onclick={() => (exportOpen = true)} class="btn-with-icon">
			<Download size={15} aria-hidden="true" /> Export
		</Button>
	</AdminPageHeader>

	<AdminPage {loading} {error} onRetry={load}>
		<AdminStack gap="md">
			{#if stats}
				<AdminGrid cols={{ default: 1, sm: 2, md: 3, lg: 5 }} gap="sm">
					<DashboardStatCard label="Total Events" value={stats.total} icon={Activity} />
					<DashboardStatCard label="Today" value={stats.today} icon={CalendarClock} />
					<DashboardStatCard label="Failed Events" value={stats.failed} icon={AlertTriangle} />
					<DashboardStatCard label="Successful Events" value={stats.successful} icon={CheckCircle2} />
					<DashboardStatCard label="Unique Admins" value={stats.uniqueAdmins} icon={Users} />
				</AdminGrid>
			{/if}

			<AdminToolbar>
				<div class="search-bar-wrapper">
					<AdminInput
						type="text"
						bind:value={params.search}
						oninput={onSearchInput}
						placeholder="Search events, emails, IDs, tokens…"
						aria-label="Search audit logs"
						icon={Search}
					/>
				</div>
				<AdminButtonGroup align="right" class="toolbar-actions">
					<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)} class="btn-with-icon">
						<SlidersHorizontal size={15} aria-hidden="true" /> Filters
						{#if activeFilterCount > 0}
							<span class="filter-badge">{activeFilterCount}</span>
						{/if}
					</Button>
					<div class="view-toggle" role="group" aria-label="View mode">
						<button
							class="view-btn"
							class:active={viewMode === 'table'}
							aria-pressed={viewMode === 'table'}
							onclick={() => (viewMode = 'table')}
						>
							<List size={15} aria-hidden="true" /> List
						</button>
						<button
							class="view-btn"
							class:active={viewMode === 'timeline'}
							aria-pressed={viewMode === 'timeline'}
							onclick={() => (viewMode = 'timeline')}
						>
							<History size={15} aria-hidden="true" /> Timeline
						</button>
					</div>
				</AdminButtonGroup>
			</AdminToolbar>

			{#if showFilters}
				<AuditFilterBar {params} {options} onApply={onFiltersApply} onClear={onFiltersClear} />
			{/if}

			{#if events.length === 0 && !loading}
				<AdminEmptyState
					title="No audit entries found"
					message={activeFilterCount || params.search
						? 'Try adjusting your search or filters.'
						: 'Administrative activity will appear here.'}
				/>
			{:else if viewMode === 'timeline'}
				<AuditTimeline {events} />
			{:else}
				<AdminTable>
					<thead>
						<tr>
							<th>Timestamp</th>
							<th>Event</th>
							<th>Module</th>
							<th>Actor</th>
							<th>Target</th>
							<th>IP</th>
							<th>Device</th>
							<th>Status</th>
							<th>Summary</th>
						</tr>
					</thead>
					<tbody>
						{#each events as row (row.id)}
							<tr
								class="audit-row"
								role="link"
								tabindex="0"
								onclick={() => openDetail(row.id)}
								onkeydown={(e) => e.key === 'Enter' && openDetail(row.id)}
							>
								<td class="nowrap">{formatDateTime(row.createdAt)}</td>
								<td><AuditEventBadge event={row.event} variant="event" /></td>
								<td><AuditEventBadge module={row.module} variant="module" /></td>
								<td>{row.actor?.email ?? '—'}</td>
								<td class="mono">{row.target ?? '—'}</td>
								<td class="mono">{row.ipAddress ?? '—'}</td>
								<td>{row.device ?? '—'}</td>
								<td><AuditEventBadge status={row.status} variant="status" /></td>
								<td class="summary">{row.summary}</td>
							</tr>
						{/each}
					</tbody>
				</AdminTable>
			{/if}

			{#if totalPages > 1 && viewMode === 'table'}
				<div class="pagination">
					<span class="pagination-info">Page {params.page ?? 1} of {totalPages} ({total} events)</span>
					<AdminButtonGroup align="right" class="pagination-buttons">
						<Button
							variant="ghost"
							size="sm"
							disabled={(params.page ?? 1) <= 1}
							onclick={() => goToPage((params.page ?? 1) - 1)}
						>
							Previous
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={(params.page ?? 1) >= totalPages}
							onclick={() => goToPage((params.page ?? 1) + 1)}
						>
							Next
						</Button>
					</AdminButtonGroup>
				</div>
			{/if}
		</AdminStack>
	</AdminPage>
</AdminPageContainer>

<AuditExportDialog {params} bind:open={exportOpen} />

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

	.view-toggle {
		display: flex;
		gap: 0.25rem;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		padding: 0.2rem;
	}

	.view-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.7rem;
		border: none;
		background: none;
		border-radius: 9px;
		color: var(--color-text);
		font-size: 0.85rem;
		cursor: pointer;
		opacity: 0.65;
		transition: var(--transition-smooth);
	}

	.view-btn.active {
		background: rgba(123, 144, 75, 0.12);
		color: var(--color-accent-green);
		opacity: 1;
		font-weight: 600;
	}

	.audit-row {
		cursor: pointer;
	}

	.audit-row:focus-visible {
		outline: 2px solid var(--color-accent-green);
		outline-offset: -2px;
	}

	.nowrap {
		white-space: nowrap;
	}

	.mono {
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		opacity: 0.8;
	}

	.summary {
		max-width: 280px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.pagination-info {
		font-size: 0.85rem;
		opacity: 0.6;
	}

	@media (max-width: 768px) {
		.search-bar-wrapper {
			width: 100%;
		}
		
		.toolbar-actions {
			width: 100%;
			justify-content: space-between;
		}
	}
</style>
