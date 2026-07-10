<script lang="ts">
	import { page } from '$app/stores';
	import CommunicationDetailView from '$lib/admin/components/CommunicationDetailView.svelte';

	let recordId = $derived($page.params.id ?? '');
</script>

{#snippet overviewContent(record: any)}
	<div class="ov">
		<div class="ov-item"><span class="ov-label">Email</span><span class="ov-value mono">{record.email}</span></div>
		<div class="ov-item"><span class="ov-label">Subscribed</span><span class="ov-value">{new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
	</div>
{/snippet}

<CommunicationDetailView
	recordType="newsletter"
	{recordId}
	title="Newsletter Subscriber"
	backHref="/admin/communication/newsletter"
	canReply={false}
	recipientEmail={(r) => r.email}
	overviewSnippet={overviewContent}
/>

<style>
	.ov { display: flex; flex-direction: column; gap: 0.85rem; }
	.ov-item { display: flex; flex-direction: column; gap: 0.15rem; }
	.ov-label {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.5;
		font-weight: 600;
	}
	.ov-value { font-size: 0.95rem; line-height: 1.5; word-break: break-word; }
	.ov-value.mono { font-family: var(--font-accent); font-size: 0.85rem; opacity: 0.7; }
</style>
