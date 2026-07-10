<script lang="ts">
	import CommunicationListView from '$lib/admin/components/CommunicationListView.svelte';
</script>

<CommunicationListView
	recordType="careers"
	title="Career Applications"
	description="Job applications submitted through the careers form"
	searchPlaceholder="Search by name, email, or phone..."
	rowFields={(r) => [
		{ label: 'name', value: r.name },
		{ label: 'email', value: r.email },
		{ label: 'phone', value: r.phone }
	]}
	rowHref={(r) => `/admin/communication/careers/${r.id}`}
/>
