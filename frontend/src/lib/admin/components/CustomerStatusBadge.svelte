<script lang="ts">
	interface Props {
		status: string;
	}

	let { status }: Props = $props();
</script>

{#if status === 'ACTIVE'}
	<span class="badge status-active">Active</span>
{:else if status === 'SUSPENDED'}
	<span class="badge status-suspended">Suspended</span>
{:else if status === 'DELETED'}
	<span class="badge status-deleted">Deleted</span>
{:else}
	<span class="badge">{status}</span>
{/if}

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.status-active {
		background: rgba(39, 59, 9, 0.15);
		color: #5a7a1a;
	}

	.status-suspended {
		background: rgba(180, 83, 9, 0.15);
		color: #d97706;
	}

	.status-deleted {
		background: rgba(220, 38, 38, 0.12);
		color: #ef4444;
	}
</style>
