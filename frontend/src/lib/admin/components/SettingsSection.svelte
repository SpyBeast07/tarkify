<script lang="ts">
	import SettingsField from './SettingsField.svelte';
	import SettingsSaveBar from './SettingsSaveBar.svelte';
	import type { SectionConfig } from '$lib/admin/types/settings';
	import AdminCard from './AdminCard.svelte';
	import AdminSectionHeader from './AdminSectionHeader.svelte';
	import AdminStack from './AdminStack.svelte';

	interface Props {
		section: SectionConfig;
		values: Record<string, unknown>;
		dirty?: boolean;
		saving?: boolean;
		success?: boolean;
		error?: string | null;
		onSave?: () => void;
		onReset?: () => void;
	}

	let {
		section,
		values = $bindable(),
		dirty = false,
		saving = false,
		success = false,
		error = null,
		onSave,
		onReset
	}: Props = $props();
</script>

<AdminCard class="settings-section">
	<AdminSectionHeader title={section.label} description={section.description} />

	<AdminStack gap="sm" class="section-fields">
		{#each section.fields as field (field.key)}
			<SettingsField config={field} bind:value={values[field.key]} disabled={saving} />
		{/each}
	</AdminStack>

	<div class="save-bar-wrapper">
		<SettingsSaveBar {dirty} {saving} {success} {error} {onSave} {onReset} />
	</div>
</AdminCard>

<style>
	:global(.settings-section.admin-card) {
		margin-bottom: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.save-bar-wrapper {
		margin-top: 0.5rem;
	}
</style>
