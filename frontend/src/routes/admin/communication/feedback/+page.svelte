<script lang="ts">
	import CommunicationListView from '$lib/admin/components/CommunicationListView.svelte';
</script>

<CommunicationListView
	recordType="feedback"
	title="Feedback"
	description="Product feedback and ratings from customers"
	searchPlaceholder="Search by name, email, or product..."
	rowFields={(r) => [
		{ label: 'name', value: r.name || 'Anonymous' },
		{ label: 'email', value: r.email || '—' },
		{ label: 'product', value: r.product },
		{ label: 'rating', value: `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}` }
	]}
	rowHref={(r) => `/admin/communication/feedback/${r.id}`}
/>
