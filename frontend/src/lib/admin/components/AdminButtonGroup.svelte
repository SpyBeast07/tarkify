<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		align?: 'left' | 'center' | 'right' | 'between';
		class?: string;
		children?: Snippet;
	}

	let { align = 'right', class: className = '', children }: Props = $props();
</script>

<div class="admin-btn-group align-{align} {className}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-btn-group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.align-left {
		justify-content: flex-start;
	}
	.align-center {
		justify-content: center;
	}
	.align-right {
		justify-content: flex-end;
	}
	.align-between {
		justify-content: space-between;
	}

	@media (max-width: 640px) {
		.admin-btn-group {
			flex-direction: column-reverse;
			align-items: stretch;
		}

		.admin-btn-group :global(.btn) {
			width: 100%;
		}
	}
</style>
