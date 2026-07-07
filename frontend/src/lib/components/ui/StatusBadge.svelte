<script lang="ts">
	interface Props {
		status: string;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();
</script>

<span class="purchase-status status-{status} {className}">{status}</span>

<style>
	.purchase-status {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		font-family: var(--font-accent);
		text-transform: capitalize;
		letter-spacing: 0.02em;
	}
</style>
