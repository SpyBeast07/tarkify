<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		class?: string;
		children?: Snippet;
	}

	let { title, description = '', class: className = '', children }: Props = $props();
</script>

<div class="admin-form-section {className}">
	<div class="form-section-header">
		<h3 class="form-section-title">{title}</h3>
		{#if description}
			<p class="form-section-desc">{description}</p>
		{/if}
	</div>
	<div class="form-section-content">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.admin-form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-glass-border);
		width: 100%;
	}

	.admin-form-section:first-child {
		padding-top: 0;
		border-top: none;
	}

	.form-section-title {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-primary-green);
		margin: 0;
	}

	.form-section-desc {
		font-size: 0.85rem;
		opacity: 0.6;
		margin: 0.25rem 0 0;
		line-height: 1.4;
	}

	.form-section-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}
</style>
