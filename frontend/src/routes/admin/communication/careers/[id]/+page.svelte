<script lang="ts">
	import { page } from '$app/stores';
	import { ExternalLink } from '@lucide/svelte';
	import CommunicationDetailView from '$lib/admin/components/CommunicationDetailView.svelte';

	let recordId = $derived($page.params.id ?? '');
</script>

{#snippet overviewContent(record: any)}
	<div class="ov">
		<div class="ov-item"><span class="ov-label">Name</span><span class="ov-value">{record.name}</span></div>
		<div class="ov-item"><span class="ov-label">Email</span><span class="ov-value mono">{record.email}</span></div>
		<div class="ov-item"><span class="ov-label">Phone</span><span class="ov-value mono">{record.phone}</span></div>
		{#if record.resume_url}
			<div class="ov-item">
				<span class="ov-label">Resume</span>
				<a class="ov-link" href={record.resume_url} target="_blank" rel="noopener noreferrer">
					View Resume <ExternalLink size={13} />
				</a>
			</div>
		{/if}
		{#if record.portfolio_url}
			<div class="ov-item">
				<span class="ov-label">Portfolio</span>
				<a class="ov-link" href={record.portfolio_url} target="_blank" rel="noopener noreferrer">
					View Portfolio <ExternalLink size={13} />
				</a>
			</div>
		{/if}
		{#if record.cover_letter}
			<div class="ov-item"><span class="ov-label">Cover Letter</span><span class="ov-value message">{record.cover_letter}</span></div>
		{/if}
	</div>
{/snippet}

<CommunicationDetailView
	recordType="careers"
	{recordId}
	title="Career Application"
	backHref="/admin/communication/careers"
	canReply={true}
	recipientEmail={(r) => r.email}
	defaultSubject={(r) => `Re: Your application to Tarkify`}
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
	.ov-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--color-accent-green);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
	}
	.ov-link:hover { text-decoration: underline; }
	.ov-value.message {
		white-space: pre-wrap;
		background: rgba(0, 0, 0, 0.12);
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		padding: 0.85rem 1rem;
	}
</style>
