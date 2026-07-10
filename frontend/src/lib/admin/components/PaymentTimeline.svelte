<script lang="ts">
	import { Clock, CheckCircle, XCircle, CreditCard, Download, Mail, RotateCcw, Eye } from '@lucide/svelte';

	interface TimelineEntry {
		id: string;
		event: string;
		user_id: string | null;
		user_name: string | null;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	interface Props {
		entries: TimelineEntry[];
		class?: string;
	}

	let { entries, class: className = '' }: Props = $props();

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="payment-timeline {className}">
	{#if entries.length === 0}
		<p class="timeline-empty">No events recorded yet.</p>
	{:else}
		<div class="timeline-list" role="list" aria-label="Payment timeline">
			{#each entries as entry}
				<div class="timeline-item" role="listitem">
					<div class="timeline-icon">
						{#if entry.event === 'order_viewed' || entry.event === 'payment_viewed' || entry.event === 'receipt_viewed'}
							<Eye size={16} />
						{:else if entry.event === 'paid' || entry.event === 'payment_captured'}
							<CheckCircle size={16} />
						{:else if entry.event === 'failed'}
							<XCircle size={16} />
						{:else if entry.event === 'refunded'}
							<RotateCcw size={16} />
						{:else if entry.event === 'download_granted'}
							<Download size={16} />
						{:else if entry.event === 'receipt_sent'}
							<Mail size={16} />
						{:else if entry.event === 'login' || entry.event === 'account_created'}
							<CreditCard size={16} />
						{:else}
							<Clock size={16} />
						{/if}
					</div>
					<div class="timeline-content">
						<span class="timeline-event">
							{entry.event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
						</span>
						<span class="timeline-user">{entry.user_name || entry.user_id || 'System'}</span>
						<span class="timeline-date">{formatDate(entry.created_at)}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.payment-timeline {
		margin-top: 0.5rem;
	}

	.timeline-empty {
		font-size: 0.85rem;
		opacity: 0.5;
		text-align: center;
		padding: 1.5rem 0;
	}

	.timeline-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.timeline-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.625rem 0;
		position: relative;
	}

	.timeline-item:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 12px;
		top: 32px;
		bottom: 0;
		width: 1px;
		background: var(--color-glass-border);
	}

	.timeline-icon {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.timeline-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.timeline-event {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.timeline-user {
		font-size: 0.8rem;
		opacity: 0.55;
	}

	.timeline-date {
		font-size: 0.75rem;
		opacity: 0.4;
	}
</style>
