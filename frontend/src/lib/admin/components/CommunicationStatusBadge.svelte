<script lang="ts">
	import type { CommStatus } from '$lib/admin/api/communication';

	interface Props {
		status: CommStatus;
	}

	let { status }: Props = $props();

	const labels: Record<CommStatus, string> = {
		NEW: 'New',
		READ: 'Read',
		REPLIED: 'Replied',
		ARCHIVED: 'Archived'
	};
</script>

<span class="badge status-{status.toLowerCase()}">{labels[status]}</span>

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

	.status-new {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.status-read {
		background: rgba(180, 83, 9, 0.15);
		color: #d97706;
	}

	.status-replied {
		background: rgba(39, 59, 9, 0.15);
		color: #5a7a1a;
	}

	.status-archived {
		background: rgba(100, 116, 139, 0.15);
		color: #64748b;
	}
</style>
