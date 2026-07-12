<script lang="ts">
	import { Send, Loader2 } from '@lucide/svelte';
	import { sendTestEmail } from '$lib/admin/api/email';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminForm from '$lib/admin/components/AdminForm.svelte';
	import AdminFormSection from '$lib/admin/components/AdminFormSection.svelte';
	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	let recipient = $state('');
	let sending = $state(false);
	let success = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

	async function handleSend(e: Event) {
		e.preventDefault();
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

<svelte:head>
	<title>Test Email | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader title="Test Email" description="Send a diagnostic email through the configured provider" />

	<AdminPage>
		<div style="max-width: 600px; margin: 0 auto;">
			<AdminCard>
				<AdminForm onsubmit={handleSend}>
					<AdminFormSection title="Send Test Email">
						<AdminInput
							type="email"
							bind:value={recipient}
							label="Recipient Email"
							placeholder="admin@example.com"
							error={errorMsg && !recipient ? errorMsg : ''}
							required
						/>
						<div style="margin-top: 1rem;">
							<AdminButtonGroup align="left">
								<Button type="submit" variant="primary" disabled={sending}>
									{#if sending}
										<Loader2 size={16} class="spin" />
										Sending...
									{:else}
										<Send size={16} />
										Send Test Email
									{/if}
								</Button>
								<Button variant="ghost" href="/admin/email" disabled={sending}>
									Cancel
								</Button>
							</AdminButtonGroup>
						</div>
					</AdminFormSection>
				</AdminForm>
			</AdminCard>

			{#if success}
				<div class="alert alert-success" role="status" style="margin-top: 1.5rem;">{success}</div>
			{/if}
			{#if errorMsg}
				<div class="alert alert-error" role="alert" style="margin-top: 1.5rem;">{errorMsg}</div>
			{/if}
		</div>
	</AdminPage>
</AdminPageContainer>

<style>
	.alert {
		padding: 0.75rem 1rem;
		border-radius: 10px;
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

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.spin) {
			animation: none;
		}
	}
</style>
