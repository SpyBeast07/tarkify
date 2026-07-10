<script lang="ts">
	import type { EmailTimelineEvent } from '$lib/admin/api/email';

	interface Props {
		events: EmailTimelineEvent[];
	}

	let { events }: Props = $props();

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}
</script>

{#if events.length === 0}
	<p class="timeline-empty">No timeline events.</p>
{:else}
	<ol class="timeline">
		{#each events as ev}
			<li class="timeline-item event-{ev.event}">
				<span class="timeline-dot"></span>
				<div class="timeline-content">
					<span class="timeline-event">{ev.event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
					<span class="timeline-desc">{ev.description}</span>
					<span class="timeline-time">{formatDate(ev.timestamp)}</span>
				</div>
			</li>
		{/each}
	</ol>
{/if}

<style>
	.timeline {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.timeline-empty {
		font-size: 0.85rem;
		opacity: 0.5;
	}
	.timeline-item {
		display: flex;
		gap: 0.75rem;
		padding-bottom: 1rem;
		position: relative;
	}
	.timeline-item:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 5px;
		top: 14px;
		bottom: 0;
		width: 2px;
		background: var(--color-glass-border);
	}
	.timeline-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-primary-green);
		flex-shrink: 0;
		margin-top: 3px;
		z-index: 1;
	}
	.event-failed .timeline-dot { background: #ef4444; }
	.event-skipped .timeline-dot { background: #d97706; }
	.event-retried .timeline-dot { background: #3b82f6; }
	.timeline-content {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.timeline-event {
		font-weight: 600;
		font-size: 0.9rem;
		text-transform: capitalize;
	}
	.timeline-desc {
		font-size: 0.82rem;
		opacity: 0.7;
	}
	.timeline-time {
		font-size: 0.75rem;
		opacity: 0.45;
	}
</style>
