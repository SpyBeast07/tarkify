<script lang="ts">
	import { page } from '$app/stores';
	import CommunicationDetailView from '$lib/admin/components/CommunicationDetailView.svelte';

	let recordId = $derived($page.params.id ?? '');
</script>

{#snippet overviewContent(record: any)}
	<div class="ov">
		<div class="ov-item"><span class="ov-label">Name</span><span class="ov-value">{record.name}</span></div>
		<div class="ov-item"><span class="ov-label">Email</span><span class="ov-value mono">{record.email}</span></div>
		{#if record.company}<div class="ov-item"><span class="ov-label">Company</span><span class="ov-value">{record.company}</span></div>{/if}
		<div class="ov-item"><span class="ov-label">Subject</span><span class="ov-value">{record.subject}</span></div>
		<div class="ov-item"><span class="ov-label">Message</span><span class="ov-value message">{record.message}</span></div>
	</div>
{/snippet}

<CommunicationDetailView
	recordType="contact"
	{recordId}
	title="Contact Message"
	backHref="/admin/communication/contact"
	canReply={true}
	recipientEmail={(r) => r.email}
	defaultSubject={(r) => `Re: ${r.subject}`}
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
	.ov-value.message {
		white-space: pre-wrap;
		background: rgba(0, 0, 0, 0.12);
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		padding: 0.85rem 1rem;
	}
</style>
