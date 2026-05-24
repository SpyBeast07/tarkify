<script lang="ts">
	import { type Snippet } from 'svelte';

	interface Props {
		variant?:
			| 'primary'
			| 'secondary'
			| 'accent'
			| 'success'
			| 'warning'
			| 'error'
			| 'coming-soon'
			| 'section';
		class?: string;
		children?: Snippet;
	}

	let { variant = 'accent', class: className = '', children }: Props = $props();
</script>

<span class="badge badge-{variant} {className}">
	{#if children}
		{@render children()}
	{/if}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 9999px;
		font-family: var(--font-accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-coming-soon {
		background: rgba(123, 144, 75, 0.15);
		color: var(--color-accent-green);
		border: 1px solid rgba(123, 144, 75, 0.3);
		padding: 0.15rem 0.5rem;
		font-size: 0.7rem;
	}

	.badge-section {
		background: rgba(39, 59, 9, 0.1);
		color: var(--color-primary-green);
		border: 1px solid rgba(39, 59, 9, 0.2);
		padding: 0.5rem 1.25rem;
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
	}

	:global([data-theme='dark']) .badge-section {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-white);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.badge-primary {
		background-color: var(--color-primary-green);
		color: var(--color-white);
	}

	.badge-secondary {
		background-color: var(--color-secondary-green);
		color: var(--color-white);
	}

	.badge-accent {
		background-color: var(--color-accent-green);
		color: var(--color-white);
	}

	.badge-success {
		background-color: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.badge-warning {
		background-color: rgba(234, 179, 8, 0.15);
		color: #eab308;
		border: 1px solid rgba(234, 179, 8, 0.3);
	}

	.badge-error {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}
</style>
