<script lang="ts">
	import { Copy, Check } from '@lucide/svelte';

	interface Props {
		token: string;
		expiresAt: string;
	}

	let { token, expiresAt }: Props = $props();

	let copied = $state(false);

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	async function copyToken() {
		try {
			await navigator.clipboard.writeText(token);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {}
	}
</script>

<div class="token-card">
	<div class="token-header">
		<span class="token-label">Download Token</span>
		<button class="copy-btn" onclick={copyToken} aria-label="Copy token">
			{#if copied}
				<Check size={14} />
			{:else}
				<Copy size={14} />
			{/if}
		</button>
	</div>
	<div class="token-value">
		<code class="token-text">{token}</code>
	</div>
	<div class="token-meta">
		<span>Expires: {formatDate(expiresAt)}</span>
	</div>
</div>

<style>
	.token-card {
		background: rgba(0, 0, 0, 0.15);
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		padding: 1rem;
	}

	.token-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.token-label {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.5;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-glass-border);
		border-radius: 6px;
		background: var(--color-glass-bg);
		color: var(--color-text);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.token-text {
		font-size: 0.75rem;
		word-break: break-all;
		opacity: 0.7;
		line-height: 1.6;
	}

	.token-meta {
		font-size: 0.75rem;
		opacity: 0.45;
		margin-top: 0.5rem;
	}
</style>
