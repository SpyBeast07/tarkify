<script lang="ts">
	import type { EmailStatus } from '$lib/admin/api/email';

	interface Props {
		status: EmailStatus;
	}

	let { status }: Props = $props();

	const labels: Record<EmailStatus, string> = {
		sent: 'Sent',
		failed: 'Failed',
		logged: 'Logged',
		skipped: 'Skipped',
		queued: 'Queued',
		retrying: 'Retrying'
	};
</script>

<span class="badge status-{status}">{labels[status] ?? status}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.status-sent {
		background: rgba(39, 59, 9, 0.15);
		color: #5a7a1a;
	}
	.status-failed {
		background: rgba(220, 38, 38, 0.12);
		color: #ef4444;
	}
	.status-logged {
		background: rgba(100, 116, 139, 0.15);
		color: #64748b;
	}
	.status-skipped {
		background: rgba(180, 83, 9, 0.15);
		color: #d97706;
	}
	.status-queued {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}
	.status-retrying {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}
</style>
