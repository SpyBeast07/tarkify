<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, Clock, User, Target, Globe, Monitor, Hash, FileJson } from '@lucide/svelte';
	import { getAuditDetail, AdminApiError } from '$lib/admin/api/audit';
	import type { AuditDetail } from '$lib/admin/types/audit';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminLoading from '$lib/admin/components/AdminLoading.svelte';
	import AdminError from '$lib/admin/components/AdminError.svelte';
	import AuditEventBadge from '$lib/admin/components/AuditEventBadge.svelte';
	import AuditMetadata from '$lib/admin/components/AuditMetadata.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const id = $derived($page.params.id);

	let detail = $state<AuditDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
      detail = await getAuditDetail(id ?? '');
		} catch (err) {
			if (err instanceof AdminApiError && (err as any).status === 404) {
				detail = null;
			} else {
				error = err instanceof AdminApiError ? err.message : 'Failed to load audit entry';
			}
		} finally {
			loading = false;
		}
	}

	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	onMount(load);
</script>

<svelte:head>
	<title>Audit Detail | Tarkify Admin</title>
</svelte:head>

<AdminPage {loading} {error} onRetry={load}>
	<AdminPageHeader title="Audit Entry">
		<Button variant="ghost" size="sm" href="/admin/audit">
			<ArrowLeft size={15} aria-hidden="true" /> Back to Audit Logs
		</Button>
	</AdminPageHeader>

	{#if !detail}
		<AdminError
			title="Not Found"
			message="This audit entry does not exist or has been removed."
			onRetry={load}
		/>
	{:else}
		<div class="detail-header glass">
			<div class="detail-badges">
				<AuditEventBadge event={detail.event} variant="event" />
				<AuditEventBadge module={detail.module} variant="module" />
				<AuditEventBadge status={detail.status} variant="status" />
			</div>
			<p class="detail-summary">{detail.summary}</p>
		</div>

		<div class="detail-grid">
			<AdminSection title="Overview">
				<dl class="detail-list">
					<div class="detail-item">
						<dt><Clock size={15} aria-hidden="true" /> Timestamp</dt>
						<dd>{formatDateTime(detail.createdAt)}</dd>
					</div>
					<div class="detail-item">
						<dt><User size={15} aria-hidden="true" /> Actor</dt>
						<dd>
							{#if detail.actor}
								{detail.actor.email}{detail.actor.name ? ` (${detail.actor.name})` : ''}
							{:else}
								— (system)
							{/if}
						</dd>
					</div>
					<div class="detail-item">
						<dt><Target size={15} aria-hidden="true" /> Target</dt>
						<dd class="mono">{detail.target ?? '—'}</dd>
					</div>
					<div class="detail-item">
						<dt><Globe size={15} aria-hidden="true" /> IP Address</dt>
						<dd class="mono">{detail.ipAddress ?? '—'}</dd>
					</div>
					<div class="detail-item">
						<dt><Monitor size={15} aria-hidden="true" /> Device</dt>
						<dd>{detail.device ?? '—'}</dd>
					</div>
					<div class="detail-item">
						<dt><Hash size={15} aria-hidden="true" /> Request ID</dt>
						<dd class="mono">{detail.requestId ?? '—'}</dd>
					</div>
					<div class="detail-item">
						<dt><FileJson size={15} aria-hidden="true" /> Event</dt>
						<dd class="mono">{detail.event}</dd>
					</div>
					<div class="detail-item">
						<dt>Module</dt>
						<dd>{detail.module}</dd>
					</div>
				</dl>
			</AdminSection>

			{#if detail.relatedEntity.length > 0}
				<AdminSection title="Related Entity">
					<dl class="detail-list">
						{#each detail.relatedEntity as rel (rel.key)}
							<div class="detail-item">
								<dt>{rel.key}</dt>
								<dd class="mono">{rel.value}</dd>
							</div>
						{/each}
					</dl>
				</AdminSection>
			{/if}

			<AdminSection title="User Agent">
				<p class="ua">{detail.userAgent ?? '—'}</p>
			</AdminSection>

			<AdminSection title="Metadata">
				<AuditMetadata data={detail.metadata} />
			</AdminSection>
		</div>
	{/if}
</AdminPage>

<style>
	.detail-header {
		padding: 1.25rem;
		border-radius: 16px;
		margin-bottom: 1rem;
	}

	.detail-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.detail-summary {
		font-size: 1rem;
		margin: 0;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1rem;
	}

	.detail-list {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.detail-item {
		display: grid;
		grid-template-columns: 150px 1fr;
		gap: 0.75rem;
		align-items: start;
	}

	.detail-item dt {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		font-weight: 600;
		opacity: 0.65;
	}

	.detail-item dd {
		margin: 0;
		font-size: 0.88rem;
		word-break: break-word;
	}

	.mono {
		font-family: var(--font-mono, monospace);
		font-size: 0.8rem;
	}

	.ua {
		font-family: var(--font-mono, monospace);
		font-size: 0.8rem;
		opacity: 0.85;
		word-break: break-word;
		margin: 0;
	}

	@media (max-width: 640px) {
		.detail-item {
			grid-template-columns: 1fr;
			gap: 0.2rem;
		}
	}
</style>
