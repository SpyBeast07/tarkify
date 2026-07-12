<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		onclick?: (event: MouseEvent) => void;
		role?: string;
		tabindex?: number;
		children?: Snippet;
	}

	let { class: className = '', onclick, role, tabindex, children }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="admin-card glass {className}"
	{role}
	{tabindex}
	onclick={onclick}
>
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.admin-card {
		padding: 1.5rem;
		border-radius: 16px;
		transition: var(--transition-smooth);
		width: 100%;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		backdrop-filter: var(--glass-blur);
	}

	.admin-card[onclick] {
		cursor: pointer;
	}

	.admin-card[onclick]:hover {
		border-color: var(--color-accent-green);
		background: rgba(123, 144, 75, 0.05);
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(39, 59, 9, 0.05);
	}
</style>
