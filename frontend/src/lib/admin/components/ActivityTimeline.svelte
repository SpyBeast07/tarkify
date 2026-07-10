<script lang="ts">
	import { Clock, LogIn, LogOut, CreditCard, Download, Mail, Shield, CheckCircle, XCircle, Eye } from '@lucide/svelte';

	interface ActivityEntry {
		id: string;
		event: string;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	interface Props {
		entries: ActivityEntry[];
		class?: string;
	}

	let { entries, class: className = '' }: Props = $props();

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function eventIcon(event: string): any {
		switch (event) {
			case 'login': return LogIn;
			case 'logout': return LogOut;
			case 'account_created': return CreditCard;
			case 'email_verified': return CheckCircle;
			case 'password_changed': return Shield;
			case 'password_reset': return Mail;
			default: return Clock;
		}
	}

	function eventLabel(event: string): string {
		return event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
	}
</script>

<div class="activity-timeline {className}">
	{#if entries.length === 0}
		<p class="timeline-empty">No activity recorded.</p>
	{:else}
		<div class="timeline-list" role="list" aria-label="Recent activity">
			{#each entries as entry}
				{@const Icon = eventIcon(entry.event)}
				<div class="timeline-item" role="listitem">
					<div class="timeline-icon">
						<Icon size={14} />
					</div>
					<div class="timeline-content">
						<span class="timeline-event">{eventLabel(entry.event)}</span>
						<span class="timeline-date">{formatDate(entry.created_at)}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.activity-timeline {
		margin-top: 0.25rem;
	}

	.timeline-empty {
		font-size: 0.85rem;
		opacity: 0.5;
		text-align: center;
		padding: 1rem 0;
	}

	.timeline-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.timeline-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.5rem 0;
		position: relative;
	}

	.timeline-item:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 11px;
		top: 28px;
		bottom: 0;
		width: 1px;
		background: var(--color-glass-border);
	}

	.timeline-icon {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		opacity: 0.5;
	}

	.timeline-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.timeline-event {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.timeline-date {
		font-size: 0.75rem;
		opacity: 0.45;
	}
</style>
