<script lang="ts">
	import AdminSwitch from './AdminSwitch.svelte';

	interface Props {
		checked: boolean;
		disabled?: boolean;
		label?: string;
		id?: string;
		onchange?: (value: boolean) => void;
	}

	let {
		checked = $bindable(),
		disabled = false,
		label = '',
		id,
		onchange
	}: Props = $props();
</script>

<AdminSwitch
	bind:checked
	{disabled}
	{label}
	{id}
	{onchange}
/>
