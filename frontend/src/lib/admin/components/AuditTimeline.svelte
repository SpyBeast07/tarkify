<script lang="ts">
	import type { AuditEventRow } from '$lib/admin/types/audit';
	import AuditEventBadge from './AuditEventBadge.svelte';

	interface Props {
		events: AuditEventRow[];
	}

	let { events }: Props = $props();

	function startOfDay(d: Date): number {
		const c = new Date(d);
		c.setHours(0, 0, 0, 0);
		return c.getTime();
	}

	function bucketOf(iso: string): 'today' | 'yesterday' | 'earlier' {
		const day = startOfDay(new Date(iso));
		const today = startOfDay(new Date());
		const yesterday = today - 86_400_000;
		if (day === today) return 'today';
		if (day === yesterday) return 'yesterday';
		return 'earlier';
	}

	const GROUPS: { id: 'today' | 'yesterday' | 'earlier'; label: string }[] = [
		{ id: 'today', label: 'Today' },
		{ id: 'yesterday', label: 'Yesterday' },
		{ id: 'earlier', label: 'Earlier' }
	];

	const grouped = $derived(
		GROUPS.map((g) => ({
			...g,
			items: events.filter((e) => bucketOf(e.createdAt) === g.id)
		})).filter((g) => g.items.length > 0)
	);

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-IN', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="audit-timeline">
	{#each grouped as group (group.id)}
		<section class="timeline-group">
			<h3 class="timeline-group-title">{group.label}</h3>
			<ul class="timeline-list">
				{#each group.items as event (event.id)}
					<li class="timeline-item">
						<span class="timeline-dot" class:failed={event.status === 'failed'} aria-hidden="true"
						></span>
						<div class="timeline-content glass">
							<div class="timeline-head">
								<AuditEventBadge event={event.event} variant="event" />
								<AuditEventBadge module={event.module} variant="module" />
								<AuditEventBadge status={event.status} variant="status" />
								<span class="timeline-time">
									{group.id === 'earlier'
										? formatDate(event.createdAt)
										: formatTime(event.createdAt)}
								</span>
							</div>
							<p class="timeline-summary">{event.summary}</p>
							{#if event.actor}
								<p class="timeline-actor">{event.actor.email}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.audit-timeline {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.timeline-group-title {
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-primary-green);
		margin: 0 0 0.75rem;
	}

	.timeline-list {
		list-style: none;
		margin: 0;
		padding: 0 0 0 1rem;
		border-left: 2px solid var(--color-glass-border);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.timeline-item {
		position: relative;
	}

	.timeline-dot {
		position: absolute;
		left: -1.45rem;
		top: 1.1rem;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-accent-green);
		border: 2px solid var(--color-light-bg);
	}

	.timeline-dot.failed {
		background: #ef4444;
	}

	.timeline-content {
		padding: 0.75rem 1rem;
		border-radius: 12px;
	}

	.timeline-head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.timeline-time {
		margin-left: auto;
		font-size: 0.78rem;
		opacity: 0.55;
	}

	.timeline-summary {
		margin: 0.4rem 0 0;
		font-size: 0.88rem;
	}

	.timeline-actor {
		margin: 0.2rem 0 0;
		font-size: 0.78rem;
		opacity: 0.6;
	}
</style>
