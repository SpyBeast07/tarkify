<script lang="ts">
	import CommunicationListView from '$lib/admin/components/CommunicationListView.svelte';
</script>

<CommunicationListView
	recordType="contact"
	title="Contact Messages"
	description="Customer inquiries submitted through the contact form"
	searchPlaceholder="Search by name, email, or subject..."
	rowFields={(r) => [
		{ label: 'name', value: r.name },
		{ label: 'email', value: r.email },
		{ label: 'subject', value: r.subject }
	]}
	rowHref={(r) => `/admin/communication/contact/${r.id}`}
/>
