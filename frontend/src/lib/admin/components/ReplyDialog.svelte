<script lang="ts">
	import { Send } from '@lucide/svelte';
	import {
		type RecordType,
		replyToRecord
	} from '$lib/admin/api/communication';
	import { AdminApiError } from '$lib/admin/api/client';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	interface Props {
		recordType: RecordType;
		recordId: string;
		recipientEmail: string;
		defaultSubject?: string;
		onSent?: () => void;
		onClose?: () => void;
	}

	let {
		recordType,
		recordId,
		recipientEmail,
		defaultSubject = '',
		onSent,
		onClose
	}: Props = $props();

	let subject = $state(defaultSubject);
	let message = $state('');
	let sending = $state(false);
	let error = $state<string | null>(null);

	async function handleSend() {
		if (!subject.trim() || !message.trim()) return;
		sending = true;
		error = null;
		try {
			await replyToRecord(recordType, recordId, subject.trim(), message.trim());
			onSent?.();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to send reply';
		} finally {
			sending = false;
		}
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose?.()} />

<div
	class="reply-overlay"
	role="presentation"
	tabindex="-1"
	aria-modal="true"
	onkeydown={(e) => { if (e.key === 'Escape') onClose?.(); }}
	onclick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
>
	<div class="reply-dialog" role="dialog" aria-labelledby="reply-title" tabindex="-1">
		<h3 id="reply-title">Reply to {recipientEmail}</h3>
		{#if error}
			<p class="reply-error" role="alert">{error}</p>
		{/if}
		<div class="reply-form">
			<Input bind:value={subject} label="Subject" placeholder="Subject..." maxlength={512} />
			<Input
				type="textarea"
				bind:value={message}
				label="Message"
				placeholder="Write your reply..."
				rows={8}
				maxlength={10000}
			/>
			<div class="reply-actions">
				<Button variant="ghost" size="sm" disabled={sending} onclick={() => onClose?.()}>Cancel</Button>
				<Button variant="primary" size="sm" disabled={sending || !subject.trim() || !message.trim()} onclick={handleSend}>
					<Send size={14} />
					{sending ? 'Sending...' : 'Send Reply'}
				</Button>
			</div>
		</div>
	</div>
</div>

<style>
	.reply-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.reply-dialog {
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 16px;
		padding: 1.5rem;
		width: 100%;
		max-width: 540px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
	}

	.reply-dialog h3 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		font-weight: 600;
		word-break: break-all;
	}

	.reply-error {
		color: #ef4444;
		font-size: 0.85rem;
		margin: 0 0 0.75rem;
	}

	.reply-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.reply-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
</style>
