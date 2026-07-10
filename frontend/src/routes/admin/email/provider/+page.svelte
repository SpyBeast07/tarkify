<script lang="ts">
	import { onMount } from 'svelte';
	import { Server } from '@lucide/svelte';
	import { getProviderStatus, type ProviderStatus } from '$lib/admin/api/email';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import ProviderStatusCard from '$lib/admin/components/ProviderStatusCard.svelte';

	let status = $state<ProviderStatus | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		loading = true;
		error = null;
		try {
			status = await getProviderStatus();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load provider status';
		} finally {
			loading = false;
		}
	});
</script>

<AdminPageHeader title="Email Provider" description="Delivery provider configuration and health" />

<AdminPage {loading} {error} onRetry={() => location.reload()}>
	{#if status}
		<ProviderStatusCard {status} />
		<p class="secret-note">
			<Server size={14} />
			API keys and secrets are never exposed to the admin interface.
		</p>
	{/if}
</AdminPage>

<style>
	.secret-note {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		opacity: 0.5;
		margin-top: 1rem;
	}
</style>
