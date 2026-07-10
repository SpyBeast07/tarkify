<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { FileDown, X, FileText, Table } from '@lucide/svelte';
	import type { AuditListParams } from '$lib/admin/types/audit';
	import { buildAuditExportUrl } from '$lib/admin/api/audit';

	interface Props {
		params: AuditListParams;
		open?: boolean;
		onClose?: () => void;
	}

	let { params, open = $bindable(false), onClose }: Props = $props();

	let format = $state<'csv' | 'json'>('csv');
	let downloading = $state(false);

	function close() {
		open = false;
		onClose?.();
	}

	function triggerDownload() {
		downloading = true;
		const url = buildAuditExportUrl(params, format);
		const a = document.createElement('a');
		a.href = url;
		a.download = '';
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => {
			downloading = false;
			close();
		}, 600);
	}
</script>

{#if open}
	<div
		class="export-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Export audit logs"
		tabindex="-1"
		onclick={(e) => e.target === e.currentTarget && close()}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div class="export-dialog glass">
			<div class="export-header">
				<h2 class="export-title">Export Audit Logs</h2>
				<button class="export-close" aria-label="Close" onclick={close}>
					<X size={18} />
				</button>
			</div>

			<p class="export-note">
				Exports respect the filters and search currently applied to the list.
			</p>

			<div class="format-options" role="radiogroup" aria-label="Export format">
				<button
					class="format-option"
					class:selected={format === 'csv'}
					role="radio"
					aria-checked={format === 'csv'}
					onclick={() => (format = 'csv')}
				>
					<Table size={18} aria-hidden="true" />
					<span>CSV</span>
				</button>
				<button
					class="format-option"
					class:selected={format === 'json'}
					role="radio"
					aria-checked={format === 'json'}
					onclick={() => (format = 'json')}
				>
					<FileText size={18} aria-hidden="true" />
					<span>JSON</span>
				</button>
			</div>

			<div class="export-actions">
				<Button variant="ghost" onclick={close}>Cancel</Button>
				<Button variant="primary" disabled={downloading} onclick={triggerDownload}>
					<FileDown size={16} aria-hidden="true" />
					{downloading ? 'Preparing…' : 'Download'}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.export-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}

	.export-dialog {
		width: 100%;
		max-width: 420px;
		padding: 1.5rem;
		border-radius: 18px;
	}

	.export-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.export-title {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		margin: 0;
		color: var(--color-primary-green);
	}

	.export-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text);
		opacity: 0.6;
		border-radius: 8px;
		padding: 0.25rem;
	}

	.export-close:hover {
		opacity: 1;
	}

	.export-note {
		font-size: 0.85rem;
		opacity: 0.65;
		margin: 0.5rem 0 1.25rem;
		line-height: 1.5;
	}

	.format-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.format-option {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 12px;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		color: var(--color-text);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.format-option.selected {
		border-color: var(--color-accent-green);
		background: rgba(123, 144, 75, 0.12);
		color: var(--color-accent-green);
	}

	.export-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
</style>
