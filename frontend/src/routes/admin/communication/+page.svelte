<script lang="ts">
	import { onMount } from 'svelte';
	import { MessageSquare, Star, Mail, Briefcase, ArrowRight } from '@lucide/svelte';
	import { listRecords, type RecordType } from '$lib/admin/api/communication';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import CommunicationCard from '$lib/admin/components/CommunicationCard.svelte';
	import { page } from '$app/stores';

	interface CardStat {
		type: RecordType;
		title: string;
		icon: any;
		href: string;
		count: number;
		newCount: number;
	}

	let stats = $state<Record<RecordType, { total: number; newCount: number }>>({
		contact: { total: 0, newCount: 0 },
		feedback: { total: 0, newCount: 0 },
		newsletter: { total: 0, newCount: 0 },
		careers: { total: 0, newCount: 0 }
	});
	let loading = $state(true);
	let error = $state<string | null>(null);

	const cards: Omit<CardStat, 'count' | 'newCount'>[] = [
		{ type: 'contact', title: 'Contact Messages', icon: MessageSquare, href: '/admin/communication/contact' },
		{ type: 'feedback', title: 'Feedback', icon: Star, href: '/admin/communication/feedback' },
		{ type: 'newsletter', title: 'Newsletter', icon: Mail, href: '/admin/communication/newsletter' },
		{ type: 'careers', title: 'Careers', icon: Briefcase, href: '/admin/communication/careers' }
	];

	async function load() {
		loading = true;
		error = null;
		try {
			const results = await Promise.all(
				(['contact', 'feedback', 'newsletter', 'careers'] as RecordType[]).map(async (type) => {
					const [all, onlyNew] = await Promise.all([
						listRecords(type, { perPage: 1 }),
						listRecords(type, { status: 'NEW', perPage: 1 })
					]);
					return { type, total: all.total, newCount: onlyNew.total };
				})
			);
			for (const r of results) {
				stats = { ...stats, [r.type]: { total: r.total, newCount: r.newCount } };
			}
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load communication overview';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<AdminPageHeader title="Communication Center" description="Manage contact messages, feedback, newsletter subscribers, and career applications" />

{#if loading}
	<p class="loading-text">Loading overview...</p>
{:else if error}
	<p class="error-text" role="alert">{error}</p>
{:else}
	<div class="card-grid">
		{#each cards as card (card.type)}
			{@const IconComp = card.icon}
			<CommunicationCard title={card.title} icon={IconComp} href={card.href}>
				<div class="card-stats">
					<span class="stat-total">{stats[card.type].total}</span>
					<span class="stat-label">total</span>
				</div>
				{#if stats[card.type].newCount > 0}
					<div class="card-new">
						<span class="new-badge">{stats[card.type].newCount} new</span>
					</div>
				{/if}
				<div class="card-cta">
					Open <ArrowRight size={14} />
				</div>
			</CommunicationCard>
		{/each}
	</div>
{/if}

<style>
	.loading-text,
	.error-text {
		font-size: 0.9rem;
		opacity: 0.6;
	}
	.error-text {
		color: #ef4444;
	}
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
	}
	.card-stats {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.stat-total {
		font-size: 2rem;
		font-weight: 700;
		font-family: var(--font-heading);
	}
	.stat-label {
		font-size: 0.85rem;
		opacity: 0.5;
	}
	.card-new {
		margin-top: 0.25rem;
	}
	.new-badge {
		display: inline-block;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.card-cta {
		margin-top: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		color: var(--color-accent-green);
		font-weight: 600;
	}
</style>
