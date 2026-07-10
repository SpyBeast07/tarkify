<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText } from '@lucide/svelte';
	import { getTemplates, type TemplateInfo } from '$lib/admin/api/email';
	import { AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import TemplateCard from '$lib/admin/components/TemplateCard.svelte';

	let templates = $state<TemplateInfo[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		loading = true;
		error = null;
		try {
			templates = await getTemplates();
		} catch (err) {
			error = err instanceof AdminApiError ? err.message : 'Failed to load templates';
		} finally {
			loading = false;
		}
	});
</script>

<AdminPageHeader title="Email Templates" description="Available email templates (read-only)" />

<AdminPage {loading} {error} onRetry={() => location.reload()}>
	<p class="ro-note">Templates are read-only in this phase. Editing arrives in a future phase.</p>
	<div class="templates-grid">
		{#each templates as t (t.key)}
			<TemplateCard template={t} />
		{/each}
	</div>
</AdminPage>

<style>
	.ro-note {
		font-size: 0.85rem;
		opacity: 0.55;
		margin: 0 0 1.25rem;
	}
	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.25rem;
	}
</style>
