<script lang="ts">
	interface Props {
		text?: string;
	}

	let { text = 'or' }: Props = $props();
</script>

<div class="divider">
	<span>{text}</span>
</div>

<style>
	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 1rem 0;
		color: var(--color-text);
		opacity: 0.4;
		font-size: 0.85rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--color-glass-border);
	}
</style>
