<script lang="ts">
	import AdminTableContainer from './AdminTableContainer.svelte';

	interface HistoryEntry {
		id: string;
		event: string;
		description: string;
		user_name: string | null;
		created_at: string;
	}

	interface Props {
		entries: HistoryEntry[];
	}

	let { entries }: Props = $props();

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function eventLabel(event: string): string {
		return event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
	}
</script>

{#if entries.length === 0}
	<p class="empty-text">No history recorded.</p>
{:else}
	<AdminTableContainer>
		<table>
			<thead>
				<tr>
					<th>Event</th>
					<th>Description</th>
					<th>Actor</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry}
					<tr>
						<td class="event-cell">{eventLabel(entry.event)}</td>
						<td>{entry.description}</td>
						<td>{entry.user_name || 'System'}</td>
						<td class="date-cell">{formatDate(entry.created_at)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</AdminTableContainer>
{/if}

<style>
	.empty-text {
		font-size: 0.85rem;
		opacity: 0.5;
		text-align: center;
		padding: 1rem 0;
	}

	.event-cell {
		font-weight: 600;
	}

	.date-cell {
		font-size: 0.85rem;
		opacity: 0.7;
	}
</style>
