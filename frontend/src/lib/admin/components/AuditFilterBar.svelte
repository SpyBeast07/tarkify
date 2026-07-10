<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { AuditListParams, AuditOptions } from '$lib/admin/types/audit';
	import { AUDIT_MODULES } from '$lib/admin/types/audit';

	interface Props {
		params: AuditListParams;
		options: AuditOptions | null;
		onApply?: () => void;
		onClear?: () => void;
	}

	let { params = $bindable(), options = null, onApply, onClear }: Props = $props();

	const eventOptions = $derived([
		{ value: '', label: 'All Events' },
		...(options?.events ?? []).map((e) => ({ value: e, label: e.replace(/_/g, ' ') }))
	]);

	const moduleOptions = $derived([
		{ value: '', label: 'All Modules' },
		...AUDIT_MODULES.map((m) => ({ value: m, label: m }))
	]);

	const actorOptions = $derived([
		{ value: '', label: 'All Actors' },
		...(options?.actors ?? []).map((a) => ({ value: a.id, label: a.email || a.name || a.id }))
	]);

	const statusOptions = [
		{ value: '', label: 'All Statuses' },
		{ value: 'success', label: 'Success' },
		{ value: 'failed', label: 'Failed' }
	];

	const sortOptions = [
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
		{ value: 'event', label: 'Event (A-Z)' },
		{ value: 'module', label: 'Module (A-Z)' },
		{ value: 'actor', label: 'Actor (A-Z)' }
	];

	function apply() {
		onApply?.();
	}
</script>

<div class="audit-filter-bar glass">
	<div class="filter-grid">
		<Input type="select" bind:value={params.event} options={eventOptions} onchange={apply} />
		<Input type="select" bind:value={params.module} options={moduleOptions} onchange={apply} />
		<Input type="select" bind:value={params.actor} options={actorOptions} onchange={apply} />
		<Input type="select" bind:value={params.status} options={statusOptions} onchange={apply} />
		<Input
			type="text"
			bind:value={params.target}
			placeholder="Target (id/email)"
			onchange={apply}
		/>
		<Input type="date" bind:value={params.dateFrom} placeholder="From date" onchange={apply} />
		<Input type="date" bind:value={params.dateTo} placeholder="To date" onchange={apply} />
		<Input type="select" bind:value={params.sort} options={sortOptions} onchange={apply} />
	</div>
	<div class="filter-actions">
		<Button variant="ghost" size="sm" onclick={onClear}>Clear Filters</Button>
	</div>
</div>

<style>
	.audit-filter-bar {
		padding: 1rem;
		border-radius: 16px;
		margin-bottom: 1rem;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.filter-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.75rem;
	}
</style>
