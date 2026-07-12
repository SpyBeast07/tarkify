<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, SlidersHorizontal, Mail, Plus, Send } from '@lucide/svelte';
	import { listEmails, getStats, getTemplates } from '$lib/admin/api/email';
	import { AdminApiError } from '$lib/admin/api/client';
	import type { EmailListParams } from '$lib/admin/api/email';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import EmailStatusBadge from '$lib/admin/components/EmailStatusBadge.svelte';
	import DashboardStatCard from '$lib/admin/components/DashboardStatCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminToolbar from '$lib/admin/components/AdminToolbar.svelte';
	import AdminFilterBar from '$lib/admin/components/AdminFilterBar.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminSelect from '$lib/admin/components/AdminSelect.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';

	interface EmailListItem {
		id: string;
		recipient: string;
		template: string;
		status: string;
		provider: string;
		provider_id: string | null;
		sent_at: string;
		error: string | null;
		subject: string | null;
	}

	interface Stats {
		total: number;
		sent: number;
		failed: number;
		logged: number;
		skipped: number;
		queued: number;
		retrying: number;
	}

	let emails = $state<EmailListItem[]>([]);
	let stats = $state<Stats | null>(null);
	let templateOptions = $state<string[]>([]);
	let total = $state(0);
	let page = $state(1);
	let totalPages = $state(0);
	let perPage = $state(20);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let search = $state('');
	let statusFilter = $state('');
	let templateFilter = $state('');
	let providerFilter = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let sort = $state('newest');

	let showFilters = $state(false);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	async function load() {
		error = null;
		try {
			const listParams: EmailListParams = {};
			if (search) listParams.search = search;
			if (statusFilter) listParams.status = statusFilter as any;
			if (templateFilter) listParams.template = templateFilter;
			if (providerFilter) listParams.provider = providerFilter;
			if (dateFrom) listParams.dateFrom = dateFrom;
			if (dateTo) listParams.dateTo = dateTo;
			listParams.sort = sort as 'newest' | 'oldest';
			listParams.page = page;
			listParams.perPage = perPage;

			const [listResult, statsResult, templatesResult] = await Promise.all([
				listEmails(listParams),
				getStats(),
				getTemplates()
			]);

			emails = listResult.emails;
			stats = {
				total: statsResult.total,
				sent: statsResult.sent,
				failed: statsResult.failed,
				logged: statsResult.logged,
				skipped: statsResult.skipped,
				queued: statsResult.queued,
				retrying: statsResult.retrying
			};
			templateOptions = templatesResult.map((t) => t.key);
			total = listResult.total;
			page = listResult.page;
			totalPages = listResult.totalPages;
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load email logs';
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
		templateFilter = '';
		providerFilter = '';
		dateFrom = '';
		dateTo = '';
		sort = 'newest';
		page = 1;
		if (searchTimer) clearTimeout(searchTimer);
		load();
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function subjectOf(e: EmailListItem): string {
		if (e.subject) return e.subject;
		return '—';
	}
</script>

<svelte:head>
	<title>Email Logs | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Email Logs" description="Platform notification history and transmission diagnostics.">
		<AdminButtonGroup align="right">
			<Button variant="outline" href="/admin/email/test" size="sm" class="btn-with-icon">
				<Send size={15} aria-hidden="true" /> Send Test Email
			</Button>
		</AdminButtonGroup>
	</AdminPageHeader>

	<AdminPage {loading} {error} onRetry={load}>
		<AdminStack gap="md">
			{#if stats}
				<AdminGrid cols={{ default: 1, sm: 2, md: 3, lg: 5 }} gap="sm">
					<DashboardStatCard label="Total Emails" value={stats.total} icon={Mail} />
					<DashboardStatCard label="Sent" value={stats.sent} icon={Send} />
					<DashboardStatCard label="Failed" value={stats.failed} icon={Plus} />
					<DashboardStatCard label="Logged" value={stats.logged} icon={Mail} />
					<DashboardStatCard label="Skipped" value={stats.skipped} icon={Mail} />
				</AdminGrid>

				<AdminCard class="delivery-card">
					<div class="delivery-groups">
						<span class="delivery-title">Delivery Status:</span>
						<div class="dg-item"><span class="dg-dot sent"></span>Sent <strong>{stats.sent}</strong></div>
						<div class="dg-item"><span class="dg-dot failed"></span>Failed <strong>{stats.failed}</strong></div>
						<div class="dg-item"><span class="dg-dot queued"></span>Queued <strong>{stats.queued}</strong></div>
						<div class="dg-item"><span class="dg-dot retrying"></span>Retrying <strong>{stats.retrying}</strong></div>
					</div>
				</AdminCard>
			{/if}

			<AdminToolbar>
				<div class="search-bar-wrapper">
					<AdminInput
						type="text"
						bind:value={search}
						placeholder="Search recipient, subject, or type..."
						oninput={onSearchInput}
						aria-label="Search emails"
						icon={Search}
					/>
				</div>
				<Button variant="ghost" size="sm" onclick={() => (showFilters = !showFilters)} class="btn-with-icon">
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
							{ value: 'sent', label: 'Sent' },
							{ value: 'failed', label: 'Failed' },
							{ value: 'logged', label: 'Logged' },
							{ value: 'skipped', label: 'Skipped' }
						]}
						class="filter-select"
						onchange={load}
					/>
					<AdminSelect
						bind:value={templateFilter}
						options={[
							{ value: '', label: 'All Types' },
							...templateOptions.map((t) => ({ value: t, label: t.replace(/^send/, '').replace(/([A-Z])/g, ' $1').trim() }))
						]}
						class="filter-select"
						onchange={load}
					/>
					<AdminSelect
						bind:value={providerFilter}
						options={[
							{ value: '', label: 'All Providers' },
							{ value: 'resend', label: 'Resend' }
						]}
						class="filter-select"
						onchange={load}
					/>
					<AdminInput
						type="date"
						bind:value={dateFrom}
						class="filter-date"
						onchange={load}
						aria-label="From Date"
					/>
					<AdminInput
						type="date"
						bind:value={dateTo}
						class="filter-date"
						onchange={load}
						aria-label="To Date"
					/>
					<AdminSelect
						bind:value={sort}
						options={[
							{ value: 'newest', label: 'Newest First' },
							{ value: 'oldest', label: 'Oldest First' }
						]}
						class="filter-select"
						onchange={load}
					/>
					<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
				</AdminFilterBar>
			{/if}

			{#if emails.length === 0}
				<AdminEmptyState title="No emails found" message={search || statusFilter || templateFilter ? 'Try adjusting your search or filters.' : 'Email activity will appear here.'} />
			{:else}
				<AdminTable>
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
							<tr
								class="email-row"
								onclick={() => (window.location.href = `/admin/email/${e.id}`)}
								role="link"
								tabindex="0"
								onkeydown={(ev) => ev.key === 'Enter' && (window.location.href = `/admin/email/${e.id}`)}
							>
								<td class="mono-small">{e.recipient}</td>
								<td class="subject-cell">{subjectOf(e)}</td>
								<td class="type-cell">{e.template.replace(/^send/, '').replace(/([A-Z])/g, ' $1').trim()}</td>
								<td><EmailStatusBadge status={e.status as any} /></td>
								<td class="prov-cell">{e.provider}</td>
								<td class="date-cell">{formatDate(e.sent_at)}</td>
								<td class="fail-cell">{e.error ? e.error : '—'}</td>
							</tr>
						{/each}
					</tbody>
				</AdminTable>

				{#if totalPages > 1}
					<div class="pagination">
						<span class="pagination-info">Page {page} of {totalPages} ({total} emails)</span>
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
		</AdminStack>
	</AdminPage>
</AdminPageContainer>

<style>
	.search-bar-wrapper {
		flex: 1;
		min-width: 220px;
	}

	:global(.delivery-card.admin-card) {
		padding: 0.85rem 1.25rem;
	}

	.delivery-groups {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: center;
	}

	.delivery-title {
		font-weight: 600;
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.dg-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.dg-item strong {
		font-weight: 700;
	}

	.dg-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.dg-dot.sent {
		background: #5a7a1a;
	}

	.dg-dot.failed {
		background: #ef4444;
	}

	.dg-dot.queued {
		background: #3b82f6;
	}

	.dg-dot.retrying {
		background: #d97706;
	}

	:global(.filter-select) {
		min-width: 160px;
	}

	:global(.filter-date.admin-input-group) {
		min-width: 130px;
	}

	.email-row {
		cursor: pointer;
	}

	.mono-small {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.75;
		color: var(--color-text);
	}

	.subject-cell {
		max-width: 260px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}

	.type-cell {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.prov-cell {
		font-size: 0.85rem;
		opacity: 0.7;
		text-transform: capitalize;
	}

	.date-cell {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.fail-cell {
		font-size: 0.78rem;
		color: #ef4444;
		max-width: 220px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
