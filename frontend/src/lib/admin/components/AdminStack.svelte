<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
		align?: 'start' | 'center' | 'end' | 'stretch';
		class?: string;
		children?: Snippet;
	}

	let { gap = 'sm', align = 'stretch', class: className = '', children }: Props = $props();

	const gapStyle = $derived.by(() => {
		const validGaps = ['xs', 'sm', 'md', 'lg', 'xl'];
		if (typeof gap === 'string' && validGaps.includes(gap)) {
			return `var(--spacing-${gap})`;
		}
		return gap;
	});
</script>

<div class="admin-stack align-{align} {className}" style="--stack-gap: {gapStyle};">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-stack {
		display: flex;
		flex-direction: column;
		gap: var(--stack-gap, 1rem);
		width: 100%;
	}

	.align-start {
		align-items: flex-start;
	}
	.align-center {
		align-items: center;
	}
	.align-end {
		align-items: flex-end;
	}
	.align-stretch {
		align-items: stretch;
	}
</style>
