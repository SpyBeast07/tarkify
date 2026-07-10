<script lang="ts">
	interface Props {
		data: Record<string, unknown> | null | undefined;
	}

	let { data }: Props = $props();

	const entries = $derived(
		data && typeof data === 'object' && !Array.isArray(data)
			? Object.entries(data as Record<string, unknown>)
			: []
	);

	function isObject(value: unknown): value is Record<string, unknown> {
		return value !== null && typeof value === 'object' && !Array.isArray(value);
	}

	function formatValue(value: unknown): string {
		if (value === null) return 'null';
		if (value === undefined) return '—';
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	}
</script>

{#if entries.length === 0}
	<p class="audit-metadata-empty">No metadata recorded.</p>
{:else}
	<dl class="audit-metadata">
		{#each entries as [key, value] (key)}
			<div class="metadata-row">
				<dt class="metadata-key">{key}</dt>
				<dd class="metadata-value">
					{#if isObject(value)}
						<pre class="metadata-json">{JSON.stringify(value, null, 2)}</pre>
					{:else}
						{formatValue(value)}
					{/if}
				</dd>
			</div>
		{/each}
	</dl>
{/if}

<style>
	.audit-metadata {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.metadata-row {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-glass-border);
	}

	.metadata-row:last-child {
		border-bottom: none;
	}

	.metadata-key {
		font-size: 0.82rem;
		font-weight: 600;
		opacity: 0.7;
		word-break: break-word;
	}

	.metadata-value {
		margin: 0;
		font-size: 0.85rem;
		word-break: break-word;
	}

	.metadata-json {
		margin: 0;
		font-family: var(--font-mono, monospace);
		font-size: 0.8rem;
		background: rgba(0, 0, 0, 0.04);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		overflow-x: auto;
		white-space: pre-wrap;
	}

	.audit-metadata-empty {
		font-size: 0.85rem;
		opacity: 0.6;
		margin: 0;
	}

	@media (max-width: 640px) {
		.metadata-row {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}
	}
</style>
