<script lang="ts">
	import type { TemplateInfo } from '$lib/admin/api/email';

	interface Props {
		template: TemplateInfo;
	}

	let { template }: Props = $props();
</script>

<div class="template-card glass">
	<div class="template-header">
		<h3>{template.name}</h3>
		{#if template.previewAvailable}
			<span class="preview-badge">Preview</span>
		{/if}
	</div>
	<p class="template-purpose">{template.purpose}</p>
	<div class="template-vars">
		<span class="vars-label">Variables</span>
		<div class="vars-list">
			{#each template.variables as v}
				<code class="var-chip">{v}</code>
			{/each}
		</div>
	</div>
</div>

<style>
	.template-card {
		padding: 1.1rem 1.25rem;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.template-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.template-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}
	.preview-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: rgba(39, 59, 9, 0.15);
		color: #5a7a1a;
	}
	.template-purpose {
		font-size: 0.85rem;
		opacity: 0.65;
		line-height: 1.5;
		margin: 0;
	}
	.template-vars {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.vars-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.45;
		font-weight: 600;
	}
	.vars-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.var-chip {
		font-size: 0.72rem;
		padding: 0.15rem 0.45rem;
		border-radius: 6px;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		font-family: var(--font-accent);
	}
</style>
