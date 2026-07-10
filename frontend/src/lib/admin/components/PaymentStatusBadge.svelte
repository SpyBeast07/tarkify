<script lang="ts">
	interface Props {
		status: string;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();
</script>

<span class="payment-status payment-status-{status} {className}">{status}</span>

<style>
	.payment-status {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		font-family: var(--font-accent);
		text-transform: capitalize;
		letter-spacing: 0.02em;
	}

	.payment-status-paid {
		background-color: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.payment-status-created {
		background-color: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
		border: 1px solid rgba(59, 130, 246, 0.3);
	}

	.payment-status-failed {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.payment-status-refunded {
		background-color: rgba(168, 85, 247, 0.15);
		color: #a855f7;
		border: 1px solid rgba(168, 85, 247, 0.3);
	}
</style>
