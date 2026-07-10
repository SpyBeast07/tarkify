<script lang="ts">
	import CommunicationListView from '$lib/admin/components/CommunicationListView.svelte';
</script>

<CommunicationListView
	recordType="newsletter"
	title="Newsletter Subscribers"
	description="Customers subscribed to the newsletter"
	searchPlaceholder="Search by email..."
	rowFields={(r) => [{ label: 'email', value: r.email, mono: true }]}
	rowHref={(r) => `/admin/communication/newsletter/${r.id}`}
/>
