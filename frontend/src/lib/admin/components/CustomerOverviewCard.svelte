<script lang="ts">
	interface Props {
		title: string;
		icon?: any;
	}

	let { title, icon: Icon = undefined, children }: Props & { children?: import('svelte').Snippet } = $props();
</script>

<div class="overview-card">
	{#if Icon || title}
		<div class="card-header">
			{#if Icon}
				<span class="card-icon"><Icon size={16} /></span>
			{/if}
			<span class="card-title">{title}</span>
		</div>
	{/if}
	<div class="card-body">
		{@render children?.()}
	</div>
</div>

<style>
	.overview-card {
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 14px;
		padding: 1.25rem;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.card-icon {
		display: flex;
		opacity: 0.45;
	}

	.card-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		opacity: 0.6;
	}

	.card-body {
		font-size: 0.9rem;
		line-height: 1.6;
	}
</style>
