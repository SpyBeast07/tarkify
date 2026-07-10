<script lang="ts">
	import AdminTableContainer from './AdminTableContainer.svelte';

	interface Session {
		id: string;
		user_id: string;
		browser: string | null;
		os: string | null;
		device_name: string | null;
		device_type: string | null;
		ip_address: string | null;
		created_at: string;
		expires_at: string;
		is_current: boolean;
	}

	interface Props {
		sessions: Session[];
	}

	let { sessions }: Props = $props();

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function browserInfo(session: Session): string {
		const parts: string[] = [];
		if (session.browser) parts.push(session.browser);
		if (session.os) parts.push(session.os);
		if (session.device_name) parts.push(session.device_name);
		return parts.join(' · ') || 'Unknown';
	}

	function platformInfo(session: Session): string {
		const parts: string[] = [];
		if (session.device_type) parts.push(session.device_type);
		return parts.join(' ') || '—';
	}
</script>

{#if sessions.length === 0}
	<p class="empty-text">No active sessions.</p>
{:else}
	<AdminTableContainer>
		<table>
			<thead>
				<tr>
					<th>Browser / OS</th>
					<th>Platform</th>
					<th>IP Address</th>
					<th>Created</th>
					<th>Expires</th>
					<th>Current</th>
				</tr>
			</thead>
			<tbody>
				{#each sessions as session}
					<tr>
						<td>{browserInfo(session)}</td>
						<td>{platformInfo(session)}</td>
						<td class="mono-small">{session.ip_address || '—'}</td>
						<td class="date-cell">{formatDate(session.created_at)}</td>
						<td class="date-cell">{formatDate(session.expires_at)}</td>
						<td>
							{#if session.is_current}
								<span class="current-badge">Current</span>
							{:else}
								<span class="inactive-text">—</span>
							{/if}
						</td>
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

	.mono-small {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.date-cell {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.current-badge {
		display: inline-flex;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(39, 59, 9, 0.15);
		color: #5a7a1a;
	}

	.inactive-text {
		opacity: 0.35;
	}
</style>
