<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, Reply, Archive, RotateCcw, Trash2 } from '@lucide/svelte';
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
	import CommunicationStatusBadge from './CommunicationStatusBadge.svelte';
	import NotesPanel from './NotesPanel.svelte';
	import TagManager from './TagManager.svelte';
	import ReplyDialog from './ReplyDialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from './AdminPageContainer.svelte';
	import AdminCard from './AdminCard.svelte';
	import AdminGrid from './AdminGrid.svelte';
	import AdminStack from './AdminStack.svelte';
	import AdminDialog from './AdminDialog.svelte';
	import AdminSectionHeader from './AdminSectionHeader.svelte';
	import AdminButtonGroup from './AdminButtonGroup.svelte';
	import AdminSelect from './AdminSelect.svelte';

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
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'notes' | 'tags'>('overview');

	let actionLoading = $state(false);
	let actionError = $state<string | null>(null);
	let actionSuccess = $state<string | null>(null);

	let statusSelect = $state<CommStatus>('NEW');
	let confirmAction = $state<null | 'archive' | 'delete'>(null);
	let showConfirmDialog = $state(false);
	let replyOpen = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			const result = await getRecord<any>(recordType, recordId);
			record = result.record;
			notes = result.notes;
			tags = result.tags;
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
		showConfirmDialog = true;
	}

	function cancelConfirm() {
		confirmAction = null;
		showConfirmDialog = false;
	}

	async function performConfirmed() {
		if (!confirmAction) return;
		actionLoading = true;
		actionError = null;
		actionSuccess = null;
		showConfirmDialog = false;
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

<AdminPageContainer>
	<AdminPage {loading} {error} onRetry={load}>
		{#if record}
			<AdminPageHeader {title} description={`Submitted ${shortDate(record.created_at)}`}>
				<AdminButtonGroup align="right">
					<Button variant="ghost" href={backHref} class="btn-with-icon">
						<ArrowLeft size={16} />
						Back
					</Button>
					{#if canReply}
						<Button variant="ghost" onclick={() => (replyOpen = true)} class="btn-with-icon">
							<Reply size={16} />
							Reply
						</Button>
					{/if}
				</AdminButtonGroup>
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
			</div>

			{#if activeTab === 'overview'}
				<AdminGrid cols={{ default: 1, md: 3 }} gap="md">
					<div class="span-two-columns">
						<AdminCard>
							<AdminSectionHeader title="Submission Details" />
							{@render overviewSnippet(record)}
						</AdminCard>
					</div>
					<AdminStack gap="md">
						<AdminCard>
							<AdminSectionHeader title="Manage" />
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
								<div class="select-wrapper">
									<AdminSelect bind:value={statusSelect} options={statusOptions} />
								</div>
								<Button variant="secondary" size="sm" disabled={actionLoading || statusSelect === record.status} onclick={changeStatus}>
									Update Status
								</Button>
							</div>

							<AdminButtonGroup align="left" class="actions-group">
								{#if record.status === 'ARCHIVED'}
									<Button variant="ghost" size="sm" disabled={actionLoading} onclick={handleRestore} class="btn-with-icon">
										<RotateCcw size={14} />
										Restore
									</Button>
								{:else}
									<Button variant="ghost" size="sm" disabled={actionLoading} onclick={() => confirmThen('archive')} class="btn-with-icon">
										<Archive size={14} />
										Archive
									</Button>
								{/if}
								<Button variant="ghost" class="btn-with-icon danger-btn" size="sm" disabled={actionLoading} onclick={() => confirmThen('delete')}>
									<Trash2 size={14} />
									Delete
								</Button>
							</AdminButtonGroup>
						</AdminCard>
					</AdminStack>
				</AdminGrid>
			{:else if activeTab === 'notes'}
				<AdminCard>
					<AdminSectionHeader title="Internal Notes" />
					<NotesPanel {recordType} {recordId} onChange={load} />
				</AdminCard>
			{:else if activeTab === 'tags'}
				<AdminCard>
					<AdminSectionHeader title="Tag Management" />
					<TagManager {recordType} {recordId} initialTags={tags} onChange={load} />
				</AdminCard>
			{/if}
		{/if}
	</AdminPage>
</AdminPageContainer>

<AdminDialog
	bind:open={showConfirmDialog}
	title={`Confirm ${confirmAction}`}
	message={confirmAction === 'archive'
		? 'This will archive the record. It will be hidden from active lists but can be restored.'
		: 'This will permanently delete the record. This action cannot be undone.'}
	confirmText={actionLoading ? 'Processing...' : 'Confirm'}
	disabled={actionLoading}
	onconfirm={performConfirmed}
	oncancel={cancelConfirm}
	variant={confirmAction === 'delete' ? 'danger' : 'primary'}
/>

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
	.span-two-columns {
		grid-column: span 2;
	}

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

	.tab:hover {
		opacity: 0.8;
	}

	.tab.active {
		opacity: 1;
		border-bottom-color: var(--color-accent-green);
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
		color: var(--color-text);
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
		align-items: flex-end;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	.select-wrapper {
		flex: 1;
	}

	.actions-group {
		margin-top: 0.5rem;
	}

	.danger-btn {
		color: #ef4444 !important;
	}

	:global(.danger-btn:hover) {
		background: rgba(220, 38, 38, 0.1) !important;
	}

	@media (max-width: 900px) {
		.span-two-columns {
			grid-column: span 1;
		}
	}
</style>
