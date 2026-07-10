<script lang="ts">
	import SettingsField from './SettingsField.svelte';
	import SettingsSaveBar from './SettingsSaveBar.svelte';
	import type { SectionConfig } from '$lib/admin/types/settings';

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

<section class="settings-section glass" aria-labelledby="{section.id}-heading">
	<header class="section-head">
		<h2 class="section-title" id="{section.id}-heading">{section.label}</h2>
		<p class="section-desc">{section.description}</p>
	</header>

	<div class="section-fields">
		{#each section.fields as field (field.key)}
			<SettingsField config={field} bind:value={values[field.key]} disabled={saving} />
		{/each}
	</div>

	<SettingsSaveBar {dirty} {saving} {success} {error} {onSave} {onReset} />
</section>

<style>
	.settings-section {
		padding: 1.5rem;
		border-radius: 16px;
		margin-bottom: 1.25rem;
	}

	.section-head {
		margin-bottom: 1.25rem;
	}

	.section-title {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
		color: var(--color-primary-green);
	}

	.section-desc {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.6;
		line-height: 1.5;
	}

	.section-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
