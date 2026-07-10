<script lang="ts">
	import type { AuditModule, AuditStatus } from '$lib/admin/types/audit';

	interface Props {
		event?: string;
		module?: AuditModule;
		status?: AuditStatus;
		variant?: 'event' | 'module' | 'status';
	}

	let { event, module, status, variant = 'event' }: Props = $props();

	function humanize(value: string): string {
		return value
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	const label = $derived(
		variant === 'event'
			? humanize(event ?? '')
			: variant === 'module'
				? (module ?? '')
				: (status ?? '')
	);

	const cls = $derived(
		variant === 'module'
			? 'badge-module'
			: variant === 'status'
				? status === 'failed'
					? 'badge-status-failed'
					: 'badge-status-success'
				: 'badge-event'
	);
</script>

<span class="audit-badge {cls}" role="status">{label}</span>

<style>
	.audit-badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 600;
		white-space: nowrap;
		line-height: 1.4;
	}

	.badge-event {
		background: rgba(123, 144, 75, 0.12);
		color: var(--color-accent-green);
	}

	.badge-module {
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
	}

	.badge-status-success {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.badge-status-failed {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
	}
</style>
