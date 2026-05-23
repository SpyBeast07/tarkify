<script lang="ts">
	import { type Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		href?: string;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		href,
		onclick,
		class: className = '',
		children
	}: Props = $props();
</script>

{#if href}
	<a
		{href}
		class="btn btn-{variant} {size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} {disabled ? 'btn-disabled' : ''} {className}"
		role="button"
		aria-disabled={disabled}
		onclick={(e) => {
			if (disabled) {
				e.preventDefault();
				return;
			}
			onclick?.(e);
		}}
	>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button
		{type}
		class="btn btn-{variant} {size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} {disabled ? 'btn-disabled' : ''} {className}"
		{disabled}
		{onclick}
	>
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}

<style>
	.btn-secondary {
		background-color: var(--color-glass-bg);
		color: var(--color-text);
		border: 1px solid var(--color-glass-border);
		backdrop-filter: var(--glass-blur);
	}
	.btn-secondary:hover {
		background-color: rgba(255, 255, 255, 0.35);
		transform: translateY(-2px);
	}
	.btn-ghost {
		background: transparent;
		color: var(--color-text);
		padding: 0.5rem 1rem;
	}
	.btn-ghost:hover {
		background-color: var(--color-glass-bg);
	}
	.btn-danger {
		background-color: #dc2626;
		color: #ffffff;
	}
	.btn-danger:hover {
		background-color: #b91c1c;
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2);
	}
	.btn-lg {
		padding: 1.25rem 3rem;
		font-size: 1.1rem;
	}
</style>
