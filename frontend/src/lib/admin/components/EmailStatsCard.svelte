<script lang="ts">
	import type { Component } from 'svelte';
	import AdminStatCard from './AdminStatCard.svelte';

	interface Props {
		label: string;
		value: string | number;
		icon?: Component<{ size?: number; class?: string }>;
		variant?: 'default' | 'success' | 'danger' | 'warning';
	}

	let { label, value, icon, variant = 'default' }: Props = $props();
</script>

<AdminStatCard
	{label}
	{value}
	{icon}
	class="variant-{variant}"
/>

<style>
	:global(.variant-success .stat-card-icon) {
		color: #5a7a1a !important;
		background: rgba(90, 122, 26, 0.08) !important;
	}
	
	:global(.variant-danger .stat-card-icon) {
		color: #ef4444 !important;
		background: rgba(239, 68, 68, 0.08) !important;
	}
	
	:global(.variant-warning .stat-card-icon) {
		color: #d97706 !important;
		background: rgba(217, 119, 6, 0.08) !important;
	}
</style>
