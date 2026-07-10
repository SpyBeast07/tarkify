<script lang="ts">
	import { Inbox } from '@lucide/svelte';
	import StateCard from '$lib/components/ui/StateCard.svelte';

	interface Props {
		title?: string;
		message?: string;
		class?: string;
	}

	let {
		title = 'Nothing here yet',
		message = 'No data to display.',
		class: className = ''
	}: Props = $props();
</script>

<StateCard type="empty" icon={Inbox} {title} {message} class={className} />
