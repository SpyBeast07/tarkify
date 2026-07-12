<script lang="ts">
	import type { Component } from 'svelte';
	import AdminMetricCard from './AdminMetricCard.svelte';

	interface Props {
		label: string;
		value: string | number;
		icon: Component<{ size?: number; class?: string }>;
		subtext?: string;
		href?: string;
	}

	let { label, value, icon, subtext = '', href }: Props = $props();
</script>

<AdminMetricCard
	{label}
	{value}
	{icon}
	{subtext}
	{href}
/>
