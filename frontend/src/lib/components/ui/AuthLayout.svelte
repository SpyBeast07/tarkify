<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		title: string;
		subtitle?: string;
		badge?: string;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		title,
		subtitle = '',
		badge = 'Account',
		children,
		footer
	}: Props = $props();
</script>

<div class="auth-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="auth-hero text-center">
			<span class="section-badge">{badge}</span>
			<h1>{title}</h1>
			{#if subtitle}
				<p class="section-subtext">{subtitle}</p>
			{/if}
		</div>

		<div transition:fly={{ y: 20, duration: 400, delay: 100 }} class="auth-card glass">
			{#if children}
				{@render children()}
			{/if}
		</div>

		{#if footer}
			<div class="auth-footer">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.auth-page .container {
		width: 100%;
	}

	.auth-hero {
		margin-bottom: 1.5rem;
	}

	.auth-hero h1 {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 5vw, 3rem);
		margin-bottom: 0.5rem;
		color: var(--color-text);
	}

	.auth-hero .section-subtext {
		max-width: 480px;
		margin: 0 auto;
	}

	.auth-card {
		max-width: 440px;
		margin: 0 auto;
		padding: 1.75rem;
		border-radius: 24px;
	}

	.auth-card :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.auth-card :global(input:not([type='checkbox']):not([type='radio'])),
	.auth-card :global(select) {
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		padding: 0.75rem 1rem 0.75rem 3rem;
		font-size: 0.95rem;
		color: var(--color-text);
		font-family: var(--font-main);
		backdrop-filter: var(--glass-blur);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		outline: none;
	}

	.auth-card :global(input:not([type='checkbox']):not([type='radio']):-webkit-autofill) {
		-webkit-box-shadow: 0 0 0 1000px var(--color-glass-bg) inset !important;
		-webkit-text-fill-color: var(--color-text) !important;
		caret-color: var(--color-text);
	}

	.auth-card :global(input:not([type='checkbox']):not([type='radio']):focus),
	.auth-card :global(select:focus) {
		border-color: var(--color-accent-green);
		box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.12);
	}

	.auth-card :global(input.input-error:not([type='checkbox']):not([type='radio'])),
	.auth-card :global(select.input-error) {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.auth-footer {
		text-align: center;
		margin-top: 1.5rem;
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.auth-footer :global(a) {
		color: var(--color-accent-green);
		text-decoration: none;
		font-weight: 600;
	}

	.auth-footer :global(a:hover) {
		text-decoration: underline;
	}
</style>
