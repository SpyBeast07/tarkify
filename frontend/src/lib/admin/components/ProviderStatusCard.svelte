<script lang="ts">
	import type { ProviderStatus } from '$lib/admin/api/email';

	interface Props {
		status: ProviderStatus;
	}

	let { status }: Props = $props();

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'Never';
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function statusLabel(s: string): string {
		switch (s) {
			case 'operational': return 'Operational';
			case 'degraded': return 'Degraded';
			case 'down': return 'Down';
			default: return 'Unconfigured';
		}
	}
</script>

<div class="provider-card glass">
	<div class="provider-top">
		<div>
			<h3>{status.name}</h3>
			<span class="provider-state" class:ok={status.configured} class:bad={!status.configured}>
				{status.configured ? 'Connected' : 'Not configured'}
			</span>
		</div>
		<div class="top-right">
			<span class="status-pill status-{status.currentStatus}">{statusLabel(status.currentStatus)}</span>
			<span class="env-badge">{status.environment}</span>
		</div>
	</div>

	<div class="provider-grid">
		<div class="prov-item">
			<span class="prov-label">API Key</span>
			<span class="prov-value">{status.apiKeyPresent ? 'Present' : 'Missing'}</span>
		</div>
		<div class="prov-item">
			<span class="prov-label">Default From</span>
			<span class="prov-value mono">{status.fromEmail}</span>
		</div>
		<div class="prov-item">
			<span class="prov-label">Reply-To</span>
			<span class="prov-value mono">{status.replyToEmail}</span>
		</div>
		<div class="prov-item">
			<span class="prov-label">Admin Email</span>
			<span class="prov-value mono">{status.adminEmail}</span>
		</div>
		<div class="prov-item">
			<span class="prov-label">Last Successful</span>
			<span class="prov-value">{formatDate(status.lastSuccessfulAt)}</span>
		</div>
		<div class="prov-item">
			<span class="prov-label">Last Failed</span>
			<span class="prov-value">{formatDate(status.lastFailedAt)}</span>
		</div>
	</div>
</div>

<style>
	.provider-card {
		padding: 1.25rem;
		border-radius: 16px;
	}
	.provider-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 0.75rem;
	}
	.top-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
	}
	.status-pill {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.status-operational { background: rgba(39, 59, 9, 0.15); color: #5a7a1a; }
	.status-degraded { background: rgba(217, 119, 6, 0.15); color: #d97706; }
	.status-down, .status-unconfigured { background: rgba(220, 38, 38, 0.12); color: #ef4444; }
	.provider-top h3 {
		margin: 0 0 0.25rem;
		font-size: 1.15rem;
		font-weight: 700;
		text-transform: capitalize;
	}
	.provider-state {
		font-size: 0.8rem;
		font-weight: 600;
	}
	.provider-state.ok { color: #5a7a1a; }
	.provider-state.bad { color: #ef4444; }
	.env-badge {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		text-transform: uppercase;
		opacity: 0.7;
	}
	.provider-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.85rem;
	}
	.prov-item {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.prov-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.5;
		font-weight: 600;
	}
	.prov-value {
		font-size: 0.9rem;
		font-weight: 500;
		word-break: break-word;
	}
	.prov-value.mono {
		font-family: var(--font-accent);
		font-size: 0.82rem;
		opacity: 0.75;
	}
</style>
