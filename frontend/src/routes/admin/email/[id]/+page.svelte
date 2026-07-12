<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, RotateCcw, Mail } from '@lucide/svelte';
	import { getEmail, resendEmail, type EmailDetail } from '$lib/admin/api/email';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import EmailStatusBadge from '$lib/admin/components/EmailStatusBadge.svelte';
	import EmailTimeline from '$lib/admin/components/EmailTimeline.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminDialog from '$lib/admin/components/AdminDialog.svelte';
	import AdminSectionHeader from '$lib/admin/components/AdminSectionHeader.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	let emailId = $derived($page.params.id ?? '');

	let email = $state<EmailDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'preview' | 'timeline'>('overview');

	let actionLoading = $state(false);
	let actionError = $state<string | null>(null);
	let actionSuccess = $state<string | null>(null);
	let confirmResend = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			email = await getEmail(emailId);
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load email';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function subjectOf(): string {
		if (!email) return '—';
		const s = email.metadata?.subject;
		return typeof s === 'string' ? s : '—';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function cancelConfirm() {
		confirmResend = false;
	}

	async function handleResend() {
		actionLoading = true;
		actionError = null;
		actionSuccess = null;
		confirmResend = false;
		try {
			const result = await resendEmail(emailId);
			actionSuccess = `Email re-sent (status: ${result.status}).`;
			await load();
		} catch (err) {
			actionError = err instanceof AdminApiError ? err.message : 'Failed to resend email';
		} finally {
			actionLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Email Details | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPage {loading} {error} onRetry={load}>
		{#if email}
			<AdminPageHeader title="Email Log Entry" description={subjectOf()}>
				<AdminButtonGroup align="right">
					<Button variant="ghost" href="/admin/email" size="sm" class="btn-with-icon">
						<ArrowLeft size={16} />
						Back
					</Button>
					{#if email.status === 'failed'}
						<Button variant="ghost" onclick={() => (confirmResend = true)} size="sm" class="btn-with-icon">
							<RotateCcw size={16} />
							Resend
						</Button>
					{/if}
				</AdminButtonGroup>
			</AdminPageHeader>

			{#if actionSuccess}
				<div class="alert alert-success" role="status">{actionSuccess}</div>
			{/if}
			{#if actionError}
				<div class="alert alert-error" role="alert">{actionError}</div>
			{/if}

			<div class="tab-bar">
				<button class="tab" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
				<button class="tab" class:active={activeTab === 'preview'} onclick={() => (activeTab = 'preview')}>Preview</button>
				<button class="tab" class:active={activeTab === 'timeline'} onclick={() => (activeTab = 'timeline')}>Timeline</button>
			</div>

			{#if activeTab === 'overview'}
				<AdminGrid cols={{ default: 1, md: 3 }} gap="md">
					<div class="span-two-columns">
						<AdminCard>
							<AdminSectionHeader title="Details" />
							<div class="detail-list">
								<div class="detail-item"><span class="detail-label">Recipient</span><span class="detail-value mono">{email.recipient}</span></div>
								<div class="detail-item"><span class="detail-label">From</span><span class="detail-value mono">{email.fromEmail}</span></div>
								<div class="detail-item"><span class="detail-label">Reply-To</span><span class="detail-value mono">{email.replyToEmail}</span></div>
								<div class="detail-item"><span class="detail-label">Subject</span><span class="detail-value">{subjectOf()}</span></div>
								<div class="detail-item"><span class="detail-label">Type</span><span class="detail-value">{email.template}</span></div>
								<div class="detail-item"><span class="detail-label">Provider</span><span class="detail-value">{email.provider}</span></div>
								<div class="detail-item"><span class="detail-label">Provider ID</span><span class="detail-value mono">{email.provider_id || '—'}</span></div>
								<div class="detail-item"><span class="detail-label">Retry Count</span><span class="detail-value">{email.retryCount}</span></div>
								<div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">{formatDate(email.sent_at)}</span></div>
							</div>
						</AdminCard>
					</div>

					<AdminStack gap="md">
						<AdminCard>
							<AdminSectionHeader title="Delivery" />
							<div class="detail-list">
								<div class="detail-item">
									<span class="detail-label">Status</span>
									<span class="detail-value"><EmailStatusBadge status={email.status} /></span>
								</div>
								{#if email.error}
									<div class="detail-item">
										<span class="detail-label">Error</span>
										<span class="detail-value error-text">{email.error}</span>
									</div>
								{/if}
							</div>
							{#if email.status === 'failed'}
								<div style="margin-top: 1rem;">
									<Button variant="ghost" size="sm" disabled={actionLoading} onclick={() => (confirmResend = true)} class="btn-with-icon">
										<RotateCcw size={14} />
										Resend Email
									</Button>
								</div>
							{/if}
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="Metadata" />
							{#if email.metadata && Object.keys(email.metadata).length > 0}
								<AdminTable>
									<thead>
										<tr>
											<th>Key</th>
											<th>Value</th>
										</tr>
									</thead>
									<tbody>
										{#each Object.entries(email.metadata) as [k, v]}
											<tr>
												<td class="mono-small">{k}</td>
												<td class="mono-small">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
											</tr>
										{/each}
									</tbody>
								</AdminTable>
							{:else}
								<AdminEmptyState title="No metadata" message="This email has no stored metadata." />
							{/if}
						</AdminCard>
					</AdminStack>
				</AdminGrid>
			{:else if activeTab === 'preview'}
				<AdminSection title="Email Preview">
					{#if email.htmlPreview}
						<div class="preview-tabs">
							<span class="preview-label"><Mail size={13} /> HTML</span>
						</div>
						<iframe class="html-preview" title="Email HTML preview" srcdoc={email.htmlPreview} sandbox="allow-same-origin"></iframe>
						{#if email.textPreview}
							<pre class="text-preview">{email.textPreview}</pre>
						{/if}
					{:else}
						<AdminEmptyState title="No preview available" message="This template type does not support inline preview." />
					{/if}
				</AdminSection>
			{:else if activeTab === 'timeline'}
				<AdminSection title="Timeline">
					<EmailTimeline events={email.timeline} />
				</AdminSection>
			{/if}
		{/if}
	</AdminPage>
</AdminPageContainer>

<AdminDialog
	bind:open={confirmResend}
	title="Confirm Resend"
	message={`This will re-send the email to ${email?.recipient || ''} using the configured provider.`}
	confirmText="Confirm Resend"
	disabled={actionLoading}
	onconfirm={handleResend}
	oncancel={cancelConfirm}
	variant="primary"
/>

<style>
	.span-two-columns {
		grid-column: span 2;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		margin-bottom: 1rem;
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

	.tab-bar {
		display: flex;
		gap: 0;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-glass-border);
		overflow-x: auto;
	}

	.tab {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		opacity: 0.55;
		color: var(--color-text);
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.tab:hover {
		opacity: 0.8;
	}

	.tab.active {
		opacity: 1;
		border-bottom-color: var(--color-accent-green);
	}

	.detail-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.detail-label {
		font-size: 0.8rem;
		opacity: 0.5;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.detail-value {
		font-size: 0.95rem;
		line-height: 1.5;
		word-break: break-word;
		color: var(--color-text);
	}

	.detail-value.mono {
		font-family: var(--font-accent);
		font-size: 0.85rem;
		opacity: 0.75;
	}

	.detail-value.error-text {
		color: #ef4444;
	}

	.mono-small {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.preview-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.preview-label {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		opacity: 0.6;
		color: var(--color-text);
	}

	.html-preview {
		width: 100%;
		min-height: 420px;
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		background: #fff;
	}

	.text-preview {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.15);
		border-radius: 10px;
		font-size: 0.8rem;
		white-space: pre-wrap;
		overflow-x: auto;
		color: var(--color-text);
	}

	@media (max-width: 900px) {
		.span-two-columns {
			grid-column: span 1;
		}
	}
</style>
