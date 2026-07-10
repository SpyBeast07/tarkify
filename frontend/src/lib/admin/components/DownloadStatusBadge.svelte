<script lang="ts">
	interface Props {
		status: string;
	}

	let { status }: Props = $props();
</script>

{#if status === 'active'}
	<span class="badge status-active">Active</span>
{:else if status === 'expired'}
	<span class="badge status-expired">Expired</span>
{:else if status === 'revoked'}
	<span class="badge status-revoked">Revoked</span>
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

	.status-expired {
		background: rgba(180, 83, 9, 0.15);
		color: #d97706;
	}

	.status-revoked {
		background: rgba(220, 38, 38, 0.12);
		color: #ef4444;
	}
</style>
