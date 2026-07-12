<script lang="ts">
	import AdminInput from './AdminInput.svelte';
	import SettingsToggle from './SettingsToggle.svelte';
	import type { FieldConfig } from '$lib/admin/types/settings';

	interface Props {
		config: FieldConfig;
		value: unknown;
		error?: string;
		disabled?: boolean;
	}

	let { config, value = $bindable(), error = '', disabled = false }: Props = $props();

	const fieldDisabled = $derived(disabled || config.readOnly === true);
</script>

{#if config.type === 'toggle'}
	<div class="field-row">
		<div class="field-row-text">
			<span class="field-label">{config.label}</span>
			{#if config.help}
				<span class="field-help">{config.help}</span>
			{/if}
		</div>
		<SettingsToggle bind:checked={value as boolean} disabled={fieldDisabled} label={config.label} />
	</div>
{:else}
	<div class="field-group">
		<label class="field-label" for="{config.key}-input">{config.label}</label>
		<AdminInput
			id={config.key}
			type="text"
			bind:value
			disabled={fieldDisabled}
			required={config.required}
			placeholder={config.placeholder}
			{error}
			help={config.help}
		/>
	</div>
{/if}

<style>
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: 100%;
	}

	.field-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text);
		opacity: 0.85;
	}

	.field-help {
		font-size: 0.78rem;
		opacity: 0.55;
		margin-top: 0.15rem;
	}

	.field-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0;
		width: 100%;
	}

	.field-row-text {
		display: flex;
		flex-direction: column;
	}
</style>
