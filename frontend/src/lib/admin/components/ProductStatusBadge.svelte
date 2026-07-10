<script lang="ts">
	interface Props {
		status: string;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();

	let variantLabel = $derived(() => {
		switch (status) {
			case 'published': return 'success';
			case 'draft': return 'warning';
			case 'archived': return 'error';
			default: return 'secondary';
		}
	});
</script>

<span class="product-status product-status-{status} {className}">{status}</span>

<style>
	.product-status {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		font-family: var(--font-accent);
		text-transform: capitalize;
		letter-spacing: 0.02em;
	}

	.product-status-draft {
		background-color: rgba(234, 179, 8, 0.15);
		color: #eab308;
		border: 1px solid rgba(234, 179, 8, 0.3);
	}

	.product-status-published {
		background-color: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.product-status-archived {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}
</style>
