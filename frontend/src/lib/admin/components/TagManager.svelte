<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, X, Pencil } from '@lucide/svelte';
	import {
		type RecordType,
		type CommTag,
		type CommRecordTag,
		listTags,
		createTag,
		addTagToRecord,
		removeTagFromRecord,
		updateTag,
		deleteTag
	} from '$lib/admin/api/communication';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminInput from './AdminInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		recordType: RecordType;
		recordId: string;
		initialTags?: CommRecordTag[];
		onChange?: () => void;
	}

	let { recordType, recordId, initialTags = [], onChange }: Props = $props();

	let allTags = $state<CommTag[]>([]);
	let assigned = $state<CommRecordTag[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let newTagName = $state('');
	let newTagColor = $state('#6366f1');
	let adding = $state(false);
	let editingId = $state<string | null>(null);
	let editingName = $state('');

	$effect(() => {
		assigned = initialTags ?? [];
	});

	async function load() {
		loading = true;
		error = null;
		try {
			allTags = await listTags();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load tags';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	const assignedIds = $derived(new Set(assigned.map((t) => t.tag_id)));
	const availableTags = $derived(allTags.filter((t) => !assignedIds.has(t.id)));

	async function handleCreate() {
		const name = newTagName.trim();
		if (!name) return;
		adding = true;
		try {
			const tag = await createTag(name, newTagColor);
			await addTagToRecord(recordType, recordId, tag.id);
			const newAssigned: CommRecordTag = {
				record_type: recordType,
				record_id: recordId,
				tag_id: tag.id,
				tag_name: tag.name,
				tag_color: tag.color,
				created_at: new Date().toISOString()
			};
			assigned = [...assigned, newAssigned];
			newTagName = '';
			newTagColor = '#6366f1';
			allTags = [...allTags, tag];
			onChange?.();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to create tag';
		} finally {
			adding = false;
		}
	}

	async function handleAssign(tag: CommTag) {
		try {
			await addTagToRecord(recordType, recordId, tag.id);
			const newAssigned: CommRecordTag = {
				record_type: recordType,
				record_id: recordId,
				tag_id: tag.id,
				tag_name: tag.name,
				tag_color: tag.color,
				created_at: new Date().toISOString()
			};
			assigned = [...assigned, newAssigned];
			onChange?.();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to assign tag';
		}
	}

	async function handleRemove(tagId: string) {
		try {
			await removeTagFromRecord(recordType, recordId, tagId);
			assigned = assigned.filter((t) => t.tag_id !== tagId);
			onChange?.();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to remove tag';
		}
	}

	async function handleEditSave(tag: CommTag) {
		const name = editingName.trim();
		if (!name) return;
		try {
			const updated = await updateTag(tag.id, name, tag.color);
			allTags = allTags.map((t) => (t.id === tag.id ? updated : t));
			assigned = assigned.map((t) =>
				t.tag_id === tag.id ? { ...t, tag_name: updated.name, tag_color: updated.color } : t
			);
			editingId = null;
			onChange?.();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to update tag';
		}
	}

	async function handleDelete(tag: CommTag) {
		try {
			await deleteTag(tag.id);
			allTags = allTags.filter((t) => t.id !== tag.id);
			assigned = assigned.filter((t) => t.tag_id !== tag.id);
			onChange?.();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to delete tag';
		}
	}
</script>

<div class="tag-manager">
	{#if error}
		<p class="tag-error" role="alert">{error}</p>
	{/if}

	<div class="tag-section">
		<h4 class="tag-subtitle">Assigned Tags</h4>
		{#if assigned.length === 0}
			<p class="tag-empty">No tags assigned.</p>
		{:else}
			<div class="tag-list">
				{#each assigned as tag (tag.tag_id)}
					<span class="tag-chip" style="--tag-color: {tag.tag_color}">
						<span class="tag-dot"></span>
						{tag.tag_name}
						<button
							class="tag-remove"
							onclick={() => handleRemove(tag.tag_id)}
							aria-label={`Remove tag ${tag.tag_name}`}
						>
							<X size={12} />
						</button>
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<div class="tag-add">
		<div class="tag-input-wrap">
			<AdminInput bind:value={newTagName} placeholder="New tag name..." maxlength={100} />
		</div>
		<input type="color" bind:value={newTagColor} class="color-input" aria-label="Tag color" />
		<Button variant="secondary" size="sm" disabled={adding || !newTagName.trim()} onclick={handleCreate} class="btn-with-icon">
			<Plus size={14} />
			Add
		</Button>
	</div>

	{#if availableTags.length > 0}
		<div class="tag-section">
			<h4 class="tag-subtitle">Available Tags</h4>
			<div class="tag-list">
				{#each availableTags as tag (tag.id)}
					<div class="tag-available-wrapper">
						<span class="tag-available">
							<span class="tag-chip" style="--tag-color: {tag.color}">
								<span class="tag-dot"></span>
								{tag.name}
								<button
									class="tag-assign"
									onclick={() => handleAssign(tag)}
									aria-label={`Assign tag ${tag.name}`}
								>
									<Plus size={12} />
								</button>
							</span>
							<button class="tag-edit" onclick={() => { editingId = tag.id; editingName = tag.name; }} aria-label={`Edit tag ${tag.name}`}>
								<Pencil size={12} />
							</button>
						</span>
						{#if editingId === tag.id}
							<div class="tag-edit-row">
								<div class="tag-edit-input-wrap">
									<AdminInput bind:value={editingName} class="tag-edit-input" maxlength={100} />
								</div>
								<Button variant="secondary" size="sm" onclick={() => handleEditSave(tag)}>Save</Button>
								<Button variant="ghost" size="sm" onclick={() => (editingId = null)}>Cancel</Button>
								<Button variant="danger" size="sm" onclick={() => handleDelete(tag)}>Delete</Button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.tag-manager {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.tag-error {
		color: #ef4444;
		font-size: 0.85rem;
		margin: 0;
	}

	.tag-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tag-subtitle {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.5;
		margin: 0;
		font-weight: 600;
	}

	.tag-empty {
		font-size: 0.85rem;
		opacity: 0.5;
		margin: 0;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.tag-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		background: color-mix(in srgb, var(--tag-color) 15%, transparent);
		color: var(--tag-color);
		border: 1px solid color-mix(in srgb, var(--tag-color) 30%, transparent);
	}

	.tag-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--tag-color);
	}

	.tag-remove,
	.tag-assign {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		cursor: pointer;
		color: inherit;
		opacity: 0.7;
		padding: 0;
	}

	.tag-remove:hover,
	.tag-assign:hover {
		opacity: 1;
	}

	.tag-add {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		max-width: 480px;
	}

	.tag-input-wrap {
		flex: 1;
	}

	.color-input {
		width: 36px;
		height: 38px;
		padding: 2px;
		border: 1px solid var(--color-glass-border);
		border-radius: 8px;
		background: var(--color-glass-bg);
		cursor: pointer;
	}

	.tag-available-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tag-available {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.tag-edit {
		display: inline-flex;
		border: none;
		background: none;
		cursor: pointer;
		opacity: 0.4;
		color: var(--color-text);
	}

	.tag-edit:hover {
		opacity: 0.8;
	}

	.tag-edit-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.tag-edit-input-wrap {
		min-width: 140px;
	}
</style>
