<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, StickyNote } from '@lucide/svelte';
	import {
		type RecordType,
		type CommNote,
		getNotes,
		addNote
	} from '$lib/admin/api/communication';
	import { AdminApiError } from '$lib/admin/api/client';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	interface Props {
		recordType: RecordType;
		recordId: string;
		onChange?: () => void;
	}

	let { recordType, recordId, onChange }: Props = $props();

	let notes = $state<CommNote[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let newNote = $state('');
	let adding = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			notes = await getNotes(recordType, recordId);
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load notes';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	async function handleAdd() {
		const content = newNote.trim();
		if (!content) return;
		adding = true;
		error = null;
		try {
			const note = await addNote(recordType, recordId, content);
			notes = [note, ...notes];
			newNote = '';
			onChange?.();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to add note';
		} finally {
			adding = false;
		}
	}
</script>

<div class="notes-panel">
	{#if error}
		<p class="notes-error" role="alert">{error}</p>
	{/if}

	{#if loading}
		<p class="notes-loading">Loading notes...</p>
	{:else if notes.length === 0}
		<div class="notes-empty">
			<StickyNote size={28} />
			<p>No internal notes yet.</p>
		</div>
	{:else}
		<ul class="notes-list">
			{#each notes as note (note.id)}
				<li class="note-item">
					<div class="note-meta">
						<span class="note-author">{note.author_name || 'Admin'}</span>
						<span class="note-date">{formatDate(note.created_at)}</span>
					</div>
					<p class="note-content">{note.content}</p>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="note-add">
		<Input
			type="textarea"
			bind:value={newNote}
			placeholder="Add an internal note (not visible to customer)..."
			rows={3}
			maxlength={5000}
		/>
		<div class="note-add-actions">
			<Button variant="primary" size="sm" disabled={adding || !newNote.trim()} onclick={handleAdd}>
				<Plus size={14} />
				Add Note
			</Button>
		</div>
	</div>
</div>

<style>
	.notes-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.notes-error {
		color: #ef4444;
		font-size: 0.85rem;
		margin: 0;
	}

	.notes-loading {
		font-size: 0.85rem;
		opacity: 0.6;
		margin: 0;
	}

	.notes-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		opacity: 0.4;
		text-align: center;
		font-size: 0.85rem;
	}

	.notes-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.note-item {
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.12);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
	}

	.note-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.4rem;
	}

	.note-author {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--color-accent-green);
	}

	.note-date {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.note-content {
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.note-add {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.note-add-actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
