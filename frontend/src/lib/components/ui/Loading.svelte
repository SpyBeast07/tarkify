<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
		color?: string;
	}

	let {
		size = 24,
		class: className = '',
		color = 'currentColor'
	}: Props = $props();
</script>

<svg
	class="spinner {className}"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width="3"
	stroke-linecap="round"
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
>
	<path d="M21 12a9 9 0 1 1-6.219-8.56" />
</svg>

<style>
	.spinner {
		animation: spin 1s linear infinite;
		display: inline-block;
		flex-shrink: 0;
	}
</style>
