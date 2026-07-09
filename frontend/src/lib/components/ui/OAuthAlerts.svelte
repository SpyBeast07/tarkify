<script lang="ts">
	import { RefreshCw, X } from '@lucide/svelte';
	import Alert from './Alert.svelte';

	interface Props {
		error: string;
		info: string;
		onretry: () => void;
		ondismiss: () => void;
	}

	let { error, info, onretry, ondismiss }: Props = $props();
</script>

{#if error}
	<Alert type="error">{error}</Alert>
	<button class="retry-btn" onclick={onretry}>
		<RefreshCw size={14} aria-hidden="true" />
		Try again
	</button>
{/if}

{#if info}
	<Alert type="info">
		<div class="info-content">
			<span>{info}</span>
			<button class="dismiss-btn" onclick={ondismiss} aria-label="Dismiss">
				<X size={14} />
			</button>
		</div>
	</Alert>
{/if}

<style>
	.info-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
	}

	.dismiss-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: inherit;
		opacity: 0.6;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}

	.dismiss-btn:hover {
		opacity: 1;
	}

	.retry-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 10px;
		font-size: 0.8rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		color: var(--color-text);
		backdrop-filter: var(--glass-blur);
		transition: var(--transition-smooth);
	}

	.retry-btn:hover {
		border-color: var(--color-accent-green);
	}
</style>
