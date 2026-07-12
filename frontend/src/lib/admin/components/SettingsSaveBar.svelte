<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { Save, RotateCcw, CheckCircle2, AlertTriangle } from '@lucide/svelte';

	interface Props {
		dirty?: boolean;
		saving?: boolean;
		success?: boolean;
		error?: string | null;
		onSave?: () => void;
		onReset?: () => void;
	}

	let {
		dirty = false,
		saving = false,
		success = false,
		error = null,
		onSave,
		onReset
	}: Props = $props();
</script>

<div class="settings-savebar">
	<div class="status" aria-live="polite">
		{#if success}
			<span class="status-ok" role="status">
				<CheckCircle2 size={16} aria-hidden="true" /> Saved
			</span>
		{:else if error}
			<Alert type="error">{error}</Alert>
		{:else if dirty}
			<span class="status-dirty" role="status">Unsaved changes</span>
		{:else}
			<span class="status-clean" role="status">All changes saved</span>
		{/if}
	</div>

	<div class="actions">
		<Button variant="ghost" size="sm" disabled={!dirty || saving} onclick={onReset} class="btn-with-icon">
			<RotateCcw size={15} aria-hidden="true" /> Reset
		</Button>
		<Button variant="primary" size="sm" disabled={!dirty || saving} onclick={onSave} class="btn-with-icon">
			<Save size={15} aria-hidden="true" />
			{saving ? 'Saving…' : 'Save'}
		</Button>
	</div>
</div>

<style>
	.settings-savebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-glass-border);
	}

	.status {
		display: flex;
		align-items: center;
		min-height: 1.5rem;
	}

	.status-clean {
		font-size: 0.85rem;
		opacity: 0.55;
	}

	.status-dirty {
		font-size: 0.85rem;
		color: #f59e0b;
	}

	.status-ok {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: #22c55e;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}
</style>
