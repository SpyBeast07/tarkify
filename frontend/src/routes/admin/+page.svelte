<script lang="ts">
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminPageHeader title="Admin Portal" description="Welcome to the Tarkify Admin Portal. Select a section from the sidebar to get started." />

<AdminSection title="Getting Started">
	<p style="opacity: 0.7; font-size: 0.9rem; margin: 0; line-height: 1.6;">
		Use the sidebar to navigate between sections. Business modules will be added in future phases.
	</p>
</AdminSection>
