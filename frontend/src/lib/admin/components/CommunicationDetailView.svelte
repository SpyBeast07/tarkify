<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, Reply, Inbox, Tag as TagIcon, History, Shield, Archive, RotateCcw, Trash2, AlertTriangle } from '@lucide/svelte';
	import {
		type RecordType,
		type CommStatus,
		getRecord,
		setStatus,
		archiveRecord,
		restoreRecord,
		deleteRecord
	} from '$lib/admin/api/communication';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from './AdminPage.svelte';
	import AdminPageHeader from './AdminPageHeader.svelte';
	import AdminTableContainer from './AdminTableContainer.svelte';
	import AdminEmptyState from './AdminEmptyState.svelte';
	import AdminSection from './AdminSection.svelte';
	import CommunicationStatusBadge from './CommunicationStatusBadge.svelte';
	import NotesPanel from './NotesPanel.svelte';
	import TagManager from './TagManager.svelte';
	import ReplyDialog from './ReplyDialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	interface Props {
		recordType: RecordType;
		recordId: string;
		title: string;
		backHref: string;
		canReply?: boolean;
		overviewSnippet: import('svelte').Snippet<[any]>;
		recipientEmail: (r: any) => string;
		defaultSubject?: (r: any) => string;
	}

	let {
		recordType,
		recordId,
		title,
		backHref,
		canReply = false,
		overviewSnippet,
		recipientEmail,
		defaultSubject
	}: Props = $props();

	let record = $state<any>(null);
	let notes = $state<any[]>([]);
	let tags = $state<any[]>([]);
	let audit = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'notes' | 'tags' | 'audit'>('overview');

	let actionLoading = $state(false);
	let actionError = $state<string | null>(null);
	let actionSuccess = $state<string | null>(null);

	let statusSelect = $state<CommStatus>('NEW');
	let confirmAction = $state<null | 'archive' | 'delete'>(null);
	let replyOpen = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			const result = await getRecord<any>(recordType, recordId);
			record = result.record;
			notes = result.notes;
			tags = result.tags;
			audit = result.audit;
			statusSelect = result.record.status;
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : `Failed to load ${title}`;
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function shortDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatDateTime(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	async function changeStatus() {
		actionLoading = true;
		actionError = null;
		actionSuccess = null;
		try {
			await setStatus(recordType, recordId, statusSelect);
			actionSuccess = `Status updated to ${statusSelect}.`;
			await load();
		} catch (err) {
			actionError = err instanceof AdminApiError ? err.message : 'Failed to update status';
		} finally {
			actionLoading = false;
		}
	}

	function confirmThen(action: 'archive' | 'delete') {
		confirmAction = action;
	}

	function cancelConfirm() {
		confirmAction = null;
	}

	async function performConfirmed() {
		if (!confirmAction) return;
		actionLoading = true;
		actionError = null;
		actionSuccess = null;
		try {
			if (confirmAction === 'archive') {
				await archiveRecord(recordType, recordId);
				actionSuccess = 'Record archived.';
			} else if (confirmAction === 'delete') {
				await deleteRecord(recordType, recordId);
				actionSuccess = 'Record deleted.';
				window.location.href = backHref;
				return;
			}
			confirmAction = null;
			await load();
		} catch (err) {
			actionError = err instanceof AdminApiError ? err.message : `Failed to ${confirmAction}`;
		} finally {
			actionLoading = false;
		}
	}

	async function handleRestore() {
		actionLoading = true;
		actionError = null;
		actionSuccess = null;
		try {
			await restoreRecord(recordType, recordId);
			actionSuccess = 'Record restored.';
			await load();
		} catch (err) {
			actionError = err instanceof AdminApiError ? err.message : 'Failed to restore';
		} finally {
			actionLoading = false;
		}
	}

	function onReplySent() {
		replyOpen = false;
		actionSuccess = 'Reply sent successfully.';
		load();
	}

	const statusOptions: { value: CommStatus; label: string }[] = [
		{ value: 'NEW', label: 'New' },
		{ value: 'READ', label: 'Read' },
		{ value: 'REPLIED', label: 'Replied' },
		{ value: 'ARCHIVED', label: 'Archived' }
	];
</script>

<AdminPage {loading} {error} onRetry={load}>
	{#if record}
		<AdminPageHeader {title} description={`Submitted ${shortDate(record.created_at)}`}>
			<Button variant="ghost" href={backHref}>
				<ArrowLeft size={16} />
				Back
			</Button>
			{#if canReply}
				<Button variant="ghost" onclick={() => (replyOpen = true)}>
					<Reply size={16} />
					Reply
				</Button>
			{/if}
		</AdminPageHeader>

		{#if actionSuccess}
			<div class="alert alert-success" role="status">{actionSuccess}</div>
		{/if}
		{#if actionError}
			<div class="alert alert-error" role="alert">{actionError}</div>
		{/if}

		<div class="tab-bar">
			<button class="tab" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
			<button class="tab" class:active={activeTab === 'notes'} onclick={() => (activeTab = 'notes')}>Notes ({notes.length})</button>
			<button class="tab" class:active={activeTab === 'tags'} onclick={() => (activeTab = 'tags')}>Tags ({tags.length})</button>
			<button class="tab" class:active={activeTab === 'audit'} onclick={() => (activeTab = 'audit')}>Audit</button>
		</div>

		{#if activeTab === 'overview'}
			<div class="detail-grid">
				<div class="detail-column-left">
					<AdminSection title="Submission">
						{@render overviewSnippet(record)}
					</AdminSection>
				</div>
				<div class="detail-column-right">
					<AdminSection title="Manage">
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Status</span>
								<span class="detail-value"><CommunicationStatusBadge status={record.status} /></span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Submitted</span>
								<span class="detail-value">{formatDateTime(record.created_at)}</span>
							</div>
							{#if record.submitted_from_ip}
								<div class="detail-item">
									<span class="detail-label">IP Address</span>
									<span class="detail-value mono">{record.submitted_from_ip}</span>
								</div>
							{/if}
							{#if record.user_agent}
								<div class="detail-item">
									<span class="detail-label">User Agent</span>
									<span class="detail-value mono small">{record.user_agent}</span>
								</div>
							{/if}
						</div>

						<div class="status-change">
							<Input type="select" bind:value={statusSelect} options={statusOptions} />
							<Button variant="secondary" size="sm" disabled={actionLoading || statusSelect === record.status} onclick={changeStatus}>
								Update Status
							</Button>
						</div>

						<div class="actions-grid">
							{#if record.status === 'ARCHIVED'}
								<Button variant="ghost" size="sm" disabled={actionLoading} onclick={handleRestore}>
									<RotateCcw size={14} />
									Restore
								</Button>
							{:else}
								<Button variant="ghost" size="sm" disabled={actionLoading} onclick={() => confirmThen('archive')}>
									<Archive size={14} />
									Archive
								</Button>
							{/if}
							<Button variant="danger" size="sm" disabled={actionLoading} onclick={() => confirmThen('delete')}>
								<Trash2 size={14} />
								Delete
							</Button>
						</div>

						{#if confirmAction}
							<div class="confirm-dialog" role="alertdialog" aria-labelledby="confirm-title">
								<div class="confirm-content">
									<div class="confirm-icon"><AlertTriangle size={20} /></div>
									<h4 id="confirm-title">Confirm {confirmAction}</h4>
									<p>
										{confirmAction === 'archive'
											? 'This will archive the record. It will be hidden from active lists but can be restored.'
											: 'This will permanently delete the record. This action cannot be undone.'}
									</p>
									<div class="confirm-buttons">
										<Button variant="primary" size="sm" disabled={actionLoading} onclick={performConfirmed}>
											{actionLoading ? 'Processing...' : 'Confirm'}
										</Button>
										<Button variant="ghost" size="sm" disabled={actionLoading} onclick={cancelConfirm}>Cancel</Button>
									</div>
								</div>
							</div>
						{/if}
					</AdminSection>
				</div>
			</div>
		{:else if activeTab === 'notes'}
			<AdminSection title="Internal Notes">
				<NotesPanel {recordType} {recordId} onChange={load} />
			</AdminSection>
		{:else if activeTab === 'tags'}
			<AdminSection title="Tags">
				<TagManager {recordType} {recordId} initialTags={tags} onChange={load} />
			</AdminSection>
		{:else if activeTab === 'audit'}
			<AdminSection title="Audit History">
				{#if audit.length === 0}
					<AdminEmptyState title="No audit entries" message="No administrative actions recorded for this record." />
				{:else}
					<AdminTableContainer>
						<table>
							<thead>
								<tr><th>Event</th><th>Admin</th><th>Date</th></tr>
							</thead>
							<tbody>
								{#each audit as entry}
									<tr>
										<td class="event-cell">{entry.event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
										<td>{entry.user_name || entry.user_id?.substring(0, 8) || 'System'}</td>
										<td class="date-cell">{formatDateTime(entry.created_at)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</AdminTableContainer>
				{/if}
			</AdminSection>
		{/if}
	{/if}
</AdminPage>

{#if replyOpen && record}
	<ReplyDialog
		{recordType}
		{recordId}
		recipientEmail={recipientEmail(record)}
		defaultSubject={defaultSubject ? defaultSubject(record) : ''}
		onSent={onReplySent}
		onClose={() => (replyOpen = false)}
	/>
{/if}

<style>
	.alert {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.alert-success {
		background: rgba(39, 59, 9, 0.12);
		color: #5a7a1a;
		border: 1px solid rgba(39, 59, 9, 0.2);
	}
	.alert-error {
		background: rgba(220, 38, 38, 0.1);
		color: #ef4444;
		border: 1px solid rgba(220, 38, 38, 0.2);
	}

	.tab-bar {
		display: flex;
		gap: 0;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-glass-border);
		overflow-x: auto;
	}

	.tab {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		opacity: 0.55;
		color: var(--color-text);
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.tab:hover { opacity: 0.8; }
	.tab.active { opacity: 1; border-bottom-color: var(--color-accent-green); }

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 1.5rem;
		align-items: start;
	}

	.detail-column-left,
	.detail-column-right {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detail-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.detail-label {
		font-size: 0.8rem;
		opacity: 0.5;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.detail-value {
		font-size: 0.95rem;
		line-height: 1.5;
		word-break: break-word;
	}

	.detail-value.mono {
		font-family: var(--font-accent);
		font-size: 0.85rem;
		opacity: 0.65;
	}

	.detail-value.mono.small {
		font-size: 0.7rem;
		word-break: break-all;
	}

	.status-change {
		display: flex;
		gap: 0.5rem;
		align-items: end;
		margin-top: 1rem;
	}

	.actions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.confirm-dialog {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: rgba(220, 38, 38, 0.06);
		border: 1px solid rgba(220, 38, 38, 0.15);
	}

	.confirm-content { text-align: center; }
	.confirm-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 0.75rem;
		opacity: 0.6;
	}
	.confirm-content h4 {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		text-transform: capitalize;
	}
	.confirm-content p {
		font-size: 0.85rem;
		opacity: 0.7;
		margin-bottom: 1rem;
	}
	.confirm-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.event-cell { font-weight: 600; }
	.date-cell { font-size: 0.85rem; opacity: 0.7; }

	@media (max-width: 900px) {
		.detail-grid { grid-template-columns: 1fr; }
	}
</style>
