<script lang="ts">
	import { Send, Loader2 } from '@lucide/svelte';
	import { sendTestEmail } from '$lib/admin/api/email';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let recipient = $state('');
	let sending = $state(false);
	let success = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

	async function handleSend() {
		if (!recipient.trim()) {
			errorMsg = 'Recipient email is required.';
			return;
		}
		sending = true;
		success = null;
		errorMsg = null;
		try {
			const result = await sendTestEmail(recipient.trim());
			success = `Test email sent (status: ${result.status}). Check ${recipient}.`;
			recipient = '';
		} catch (err) {
			errorMsg = err instanceof AdminApiError ? err.message : 'Failed to send test email';
		} finally {
			sending = false;
		}
	}
</script>

<AdminPageHeader title="Test Email" description="Send a diagnostic email through the configured provider" />

<AdminPage>
	<AdminSection title="Send Test Email">
		<div class="test-form">
			<Input
				type="email"
				bind:value={recipient}
				label="Recipient"
				placeholder="admin@example.com"
				error={errorMsg && !recipient ? errorMsg : ''}
			/>
			<div class="form-actions">
				<Button variant="primary" onclick={handleSend} disabled={sending}>
					{#if sending}
						<Loader2 size={16} class="spin" />
						Sending...
					{:else}
						<Send size={16} />
						Send Test Email
					{/if}
				</Button>
			</div>
		</div>

		{#if success}
			<p class="alert alert-success" role="status">{success}</p>
		{/if}
		{#if errorMsg}
			<p class="alert alert-error" role="alert">{errorMsg}</p>
		{/if}
	</AdminSection>
</AdminPage>

<style>
	.test-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 480px;
	}
	.form-actions {
		display: flex;
		justify-content: flex-start;
	}
	.alert {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		margin-top: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.alert-success {
		background: rgba(39, 59, 9, 0.12);
		color: #5a7a1a;
		border: 1px solid rgba(39, 59, 9, 0.2);
	}
	.alert-error {
		background: rgba(220, 38, 38, 0.1);
		color: #ef4444;
		border: 1px solid rgba(220, 38, 38, 0.2);
	}
	:global(.spin) { animation: spin 1s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	@media (prefers-reduced-motion: reduce) {
		:global(.spin) { animation: none; }
	}
</style>
