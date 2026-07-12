<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		cols?: number | { default?: number; sm?: number; md?: number; lg?: number; xl?: number };
		gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
		class?: string;
		children?: Snippet;
	}

	let { cols = 1, gap = 'sm', class: className = '', children }: Props = $props();

	const colStyles = $derived.by(() => {
		if (typeof cols === 'number') {
			return `--grid-cols: ${cols};`;
		}
		let styles = '';
		if (cols.default) styles += `--grid-cols: ${cols.default};`;
		if (cols.sm) styles += `--grid-cols-sm: ${cols.sm};`;
		if (cols.md) styles += `--grid-cols-md: ${cols.md};`;
		if (cols.lg) styles += `--grid-cols-lg: ${cols.lg};`;
		if (cols.xl) styles += `--grid-cols-xl: ${cols.xl};`;
		return styles;
	});

	const gapStyle = $derived.by(() => {
		const validGaps = ['xs', 'sm', 'md', 'lg', 'xl'];
		if (typeof gap === 'string' && validGaps.includes(gap)) {
			return `var(--spacing-${gap})`;
		}
		return gap;
	});
</script>

<div
	class="admin-grid {className} {typeof cols !== 'number' ? 'responsive-cols' : ''}"
	style="{colStyles} --grid-gap: {gapStyle};"
>
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols, 1), minmax(0, 1fr));
		gap: var(--grid-gap, 1rem);
		width: 100%;
	}

	.responsive-cols {
		grid-template-columns: repeat(var(--grid-cols, 1), minmax(0, 1fr));
	}

	@media (min-width: 640px) {
		.responsive-cols {
			grid-template-columns: repeat(var(--grid-cols-sm, var(--grid-cols, 1)), minmax(0, 1fr));
		}
	}

	@media (min-width: 768px) {
		.responsive-cols {
			grid-template-columns: repeat(
				var(--grid-cols-md, var(--grid-cols-sm, var(--grid-cols, 1))),
				minmax(0, 1fr)
			);
		}
	}

	@media (min-width: 1024px) {
		.responsive-cols {
			grid-template-columns: repeat(
				var(--grid-cols-lg, var(--grid-cols-md, var(--grid-cols-sm, var(--grid-cols, 1)))),
				minmax(0, 1fr)
			);
		}
	}

	@media (min-width: 1280px) {
		.responsive-cols {
			grid-template-columns: repeat(
				var(
					--grid-cols-xl,
					var(--grid-cols-lg, var(--grid-cols-md, var(--grid-cols-sm, var(--grid-cols, 1))))
				),
				minmax(0, 1fr)
			);
		}
	}
</style>
