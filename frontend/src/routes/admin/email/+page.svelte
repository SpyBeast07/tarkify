<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, Mail, CheckCircle2, XCircle, Clock, Percent, Activity } from '@lucide/svelte';
	import {
		type EmailListParams,
		type EmailLogRecord,
		type EmailStats,
		listEmails,
		getStats
	} from '$lib/admin/api/email';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminTableContainer from '$lib/admin/components/AdminTableContainer.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import EmailStatusBadge from '$lib/admin/components/EmailStatusBadge.svelte';
	import EmailStatsCard from '$lib/admin/components/EmailStatsCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let emails = $state<EmailLogRecord[]>([]);
	let total = $state(0);
	let page = $state(1);
	let totalPages = $state(0);
	let perPage = $state(20);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let stats = $state<EmailStats | null>(null);

	let search = $state('');
	let statusFilter = $state('');
	let templateFilter = $state('');
	let providerFilter = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let sort = $state<'newest' | 'oldest'>('newest');
	let showFilters = $state(false);

	let templateOptions = $state<string[]>([]);

	async function load() {
		loading = true;
		error = null;
		const params: EmailListParams = {
			search: search || undefined,
			status: (statusFilter || undefined) as EmailListParams['status'],
			template: templateFilter || undefined,
			provider: providerFilter || undefined,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined,
			sort,
			page,
			perPage
		};
		try {
			const [listResult, statsResult] = await Promise.all([
				listEmails(params),
				getStats()
			]);
			emails = listResult.emails;
			total = listResult.total;
			page = listResult.page;
			totalPages = listResult.totalPages;
			stats = statsResult;
			const tmpls = new Set(emails.map((e) => e.template));
			templateOptions = Array.from(tmpls).sort();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load emails';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function handleSearch() {
		page = 1;
		load();
	}
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}
	function goToPage(p: number) {
		page = p;
		load();
	}
	function clearFilters() {
		search = '';
		statusFilter = '';
		templateFilter = '';
		providerFilter = '';
		dateFrom = '';
		dateTo = '';
		sort = 'newest';
		page = 1;
		load();
	}

	function subjectOf(r: EmailLogRecord): string {
		const s = r.metadata?.subject;
		return typeof s === 'string' ? s : '—';
	}
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}
</script>

<AdminPageHeader title="Email Center" description="Monitor sent, failed, and logged emails across the system">
	<Button variant="ghost" disabled>{total} Emails</Button>
</AdminPageHeader>

{#if stats}
	<div class="stats-grid">
		<EmailStatsCard label="Total Emails" value={stats.total} icon={Mail} />
		<EmailStatsCard label="Sent" value={stats.sent} icon={CheckCircle2} variant="success" />
		<EmailStatsCard label="Failed" value={stats.failed} icon={XCircle} variant="danger" />
		<EmailStatsCard label="Queued" value={stats.queued} icon={Clock} variant="warning" />
		<EmailStatsCard label="Success Rate" value={`${stats.successRate}%`} icon={Percent} />
		<EmailStatsCard label="Last 24h" value={stats.last24h} icon={Activity} />
	</div>

	<div class="delivery-groups">
		<div class="dg-item"><span class="dg-dot sent"></span>Sent <strong>{stats.sent}</strong></div>
		<div class="dg-item"><span class="dg-dot failed"></span>Failed <strong>{stats.failed}</strong></div>
		<div class="dg-item"><span class="dg-dot queued"></span>Queued <strong>{stats.queued}</strong></div>
		<div class="dg-item"><span class="dg-dot retrying"></span>Retrying <strong>{stats.retrying}</strong></div>
	</div>
{/if}

<AdminPage {loading} {error} onRetry={load}>
	<div class="toolbar">
		<div class="search-bar">
			<span class="search-icon"><Search size={16} /></span>
			<input type="text" bind:value={search} placeholder="Search recipient, subject, or type..." onkeydown={handleKeydown} aria-label="Search emails" />
		</div>
		<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)}>
			<SlidersHorizontal size={16} />
			Filters
		</Button>
	</div>

	{#if showFilters}
		<div class="filters-bar">
			<Input type="select" bind:value={statusFilter} options={[
				{ value: '', label: 'All Statuses' },
				{ value: 'sent', label: 'Sent' },
				{ value: 'failed', label: 'Failed' },
				{ value: 'logged', label: 'Logged' },
				{ value: 'skipped', label: 'Skipped' }
			]} class="filter-select" onchange={load} />
			<Input type="select" bind:value={templateFilter} options={[
				{ value: '', label: 'All Types' },
				...templateOptions.map((t) => ({ value: t, label: t.replace(/^send/, '').replace(/([A-Z])/g, ' $1').trim() }))
			]} class="filter-select" onchange={load} />
			<Input type="select" bind:value={providerFilter} options={[
				{ value: '', label: 'All Providers' },
				{ value: 'resend', label: 'Resend' }
			]} class="filter-select" onchange={load} />
			<Input type="date" bind:value={dateFrom} label="From" class="filter-select" onchange={load} />
			<Input type="date" bind:value={dateTo} label="To" class="filter-select" onchange={load} />
			<Input type="select" bind:value={sort} options={[
				{ value: 'newest', label: 'Newest First' },
				{ value: 'oldest', label: 'Oldest First' }
			]} class="filter-select" onchange={load} />
			<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
		</div>
	{/if}

	{#if emails.length === 0}
		<AdminEmptyState title="No emails found" message={search || statusFilter || templateFilter ? 'Try adjusting your search or filters.' : 'Email activity will appear here.'} />
	{:else}
		<AdminTableContainer>
			<table>
				<thead>
					<tr>
						<th>Recipient</th>
						<th>Subject</th>
						<th>Type</th>
						<th>Status</th>
						<th>Provider</th>
						<th>Created</th>
						<th>Failure</th>
					</tr>
				</thead>
				<tbody>
					{#each emails as e (e.id)}
						<tr class="email-row" onclick={() => (window.location.href = `/admin/email/${e.id}`)} role="link" tabindex="0" onkeydown={(ev) => ev.key === 'Enter' && (window.location.href = `/admin/email/${e.id}`)}>
							<td class="mono-small">{e.recipient}</td>
							<td class="subject-cell">{subjectOf(e)}</td>
							<td class="type-cell">{e.template.replace(/^send/, '').replace(/([A-Z])/g, ' $1').trim()}</td>
							<td><EmailStatusBadge status={e.status} /></td>
							<td class="prov-cell">{e.provider}</td>
							<td class="date-cell">{formatDate(e.sent_at)}</td>
							<td class="fail-cell">{e.error ? e.error : '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</AdminTableContainer>

		{#if totalPages > 1}
			<div class="pagination">
				<span class="pagination-info">Page {page} of {totalPages} ({total} emails)</span>
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
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	.delivery-groups {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		padding: 0.85rem 1.25rem;
		border-radius: 12px;
		background: var(--color-glass-bg);
		margin-bottom: 1.25rem;
	}
	.dg-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	.dg-item strong { font-weight: 700; }
	.dg-dot {
		width: 10px; height: 10px; border-radius: 50%;
	}
	.dg-dot.sent { background: #5a7a1a; }
	.dg-dot.failed { background: #ef4444; }
	.dg-dot.queued { background: #3b82f6; }
	.dg-dot.retrying { background: #d97706; }

	.toolbar {
		display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem;
	}
	.search-bar {
		flex: 1; display: flex; align-items: center; gap: 0.5rem;
		padding: 0.5rem 0.75rem; background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border); border-radius: 12px;
	}
	.search-bar:focus-within { border-color: var(--color-primary-green); box-shadow: 0 0 0 3px rgba(39, 59, 9, 0.1); }
	.search-icon { display: flex; flex-shrink: 0; opacity: 0.4; }
	.search-bar input { flex: 1; border: none; background: transparent; outline: none; font-size: 0.9rem; color: var(--color-text); }
	.filters-bar {
		display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end;
		margin-bottom: 1rem; padding: 1rem; border-radius: 12px; background: var(--color-glass-bg);
	}
	:global(.filter-select) { min-width: 160px; }
	.email-row { cursor: pointer; }
	.mono-small { font-family: var(--font-accent); font-size: 0.8rem; opacity: 0.75; }
	.subject-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.type-cell { font-size: 0.85rem; opacity: 0.8; }
	.prov-cell { font-size: 0.85rem; opacity: 0.7; text-transform: capitalize; }
	.date-cell { font-size: 0.85rem; opacity: 0.7; }
	.fail-cell { font-size: 0.78rem; color: #ef4444; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; gap: 1rem; flex-wrap: wrap; }
	.pagination-info { font-size: 0.85rem; opacity: 0.6; }
	.pagination-buttons { display: flex; gap: 0.25rem; align-items: center; }
	@media (max-width: 768px) {
		.filters-bar { flex-direction: column; }
		:global(.filter-select) { width: 100%; }
	}
</style>
