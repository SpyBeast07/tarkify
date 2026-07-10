<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import SettingsToggle from './SettingsToggle.svelte';
	import type { FieldConfig, SocialLink } from '$lib/admin/types/settings';

	interface Props {
		config: FieldConfig;
		value: unknown;
		error?: string;
		disabled?: boolean;
	}

	let { config, value = $bindable(), error = '', disabled = false }: Props = $props();

	const fieldDisabled = $derived(disabled || config.readOnly === true);

	let tagDraft = $state('');

	function addTag() {
		const v = tagDraft.trim();
		if (!v) return;
		const arr = Array.isArray(value) ? [...(value as string[])] : [];
		if (!arr.includes(v)) arr.push(v);
		value = arr;
		tagDraft = '';
	}

	function removeTag(index: number) {
		const arr = Array.isArray(value) ? [...(value as string[])] : [];
		arr.splice(index, 1);
		value = arr;
	}

	function addSocial() {
		const arr = Array.isArray(value) ? [...(value as SocialLink[])] : [];
		arr.push({ label: '', url: '' });
		value = arr;
	}

	function removeSocial(index: number) {
		const arr = Array.isArray(value) ? [...(value as SocialLink[])] : [];
		arr.splice(index, 1);
		value = arr;
	}

	function updateSocial(index: number, key: keyof SocialLink, val: string) {
		const arr = Array.isArray(value) ? [...(value as SocialLink[])] : [];
		arr[index] = { ...arr[index], [key]: val };
		value = arr;
	}
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
{:else if config.type === 'color'}
	<div class="field-group">
		<label class="field-label" for="{config.key}-input">{config.label}</label>
		<div class="color-row">
			<input
				id="{config.key}-color"
				class="color-swatch"
				type="color"
				bind:value
				disabled={fieldDisabled}
				aria-label={config.label}
			/>
			<Input
				id="{config.key}-input"
				type="text"
				bind:value
				disabled={fieldDisabled}
				placeholder="#7b904b"
				{error}
			/>
		</div>
	</div>
{:else if config.type === 'tags'}
	<div class="field-group">
		<label class="field-label" for="{config.key}-input">{config.label}</label>
		<div class="tag-list" role="list">
			{#each (value as string[]) || [] as tag, i}
				<span class="tag-chip" role="listitem">
					{tag}
					<button
						type="button"
						class="tag-remove"
						aria-label="Remove {tag}"
						disabled={fieldDisabled}
						onclick={() => removeTag(i)}>×</button
					>
				</span>
			{/each}
		</div>
		<div class="tag-input-row">
			<Input
				id="{config.key}-input"
				type="text"
				bind:value={tagDraft}
				disabled={fieldDisabled}
				placeholder="Add keyword and press Enter"
				onkeydown={(e: KeyboardEvent) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						addTag();
					}
				}}
			/>
			<button type="button" class="tag-add" disabled={fieldDisabled} onclick={addTag}>Add</button>
		</div>
		{#if config.help}<span class="field-help">{config.help}</span>{/if}
	</div>
{:else if config.type === 'social'}
	<div class="field-group">
		<label class="field-label">{config.label}</label>
		<div class="social-list">
			{#each (value as SocialLink[]) || [] as link, i}
				<div class="social-row">
					<Input
						type="text"
						bind:value={link.label}
						disabled={fieldDisabled}
						placeholder="Label (e.g. Twitter)"
						aria-label="Social label"
					/>
					<Input
						type="url"
						value={link.url}
						disabled={fieldDisabled}
						placeholder="https://…"
						aria-label="Social URL"
						oninput={(e: Event) => updateSocial(i, 'url', (e.target as HTMLInputElement).value)}
					/>
					<button
						type="button"
						class="social-remove"
						aria-label="Remove link"
						disabled={fieldDisabled}
						onclick={() => removeSocial(i)}>×</button
					>
				</div>
			{/each}
		</div>
		<button type="button" class="social-add" disabled={fieldDisabled} onclick={addSocial}
			>Add Social Link</button
		>
	</div>
{:else}
	<Input
		id={config.key}
		type={config.type}
		bind:value
		label={config.label}
		disabled={fieldDisabled}
		required={config.required}
		placeholder={config.placeholder}
		{error}
		options={config.options}
		min={config.min}
		max={config.max}
		help={config.help}
	/>
{/if}

<style>
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text);
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
	}

	.field-row-text {
		display: flex;
		flex-direction: column;
	}

	.color-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-swatch {
		width: 44px;
		height: 38px;
		padding: 2px;
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		background: var(--color-glass-bg);
		cursor: pointer;
		flex-shrink: 0;
	}

	.color-row :global(.form-group) {
		flex: 1;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.tag-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: rgba(123, 144, 75, 0.12);
		color: var(--color-accent-green);
		border-radius: 999px;
		padding: 0.2rem 0.6rem;
		font-size: 0.82rem;
	}

	.tag-remove {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		opacity: 0.7;
	}

	.tag-remove:hover {
		opacity: 1;
	}

	.tag-input-row {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.tag-input-row :global(.form-group) {
		flex: 1;
	}

	.tag-add,
	.social-add {
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		padding: 0.5rem 0.9rem;
		font-size: 0.85rem;
		cursor: pointer;
		color: var(--color-text);
		white-space: nowrap;
	}

	.tag-add:hover,
	.social-add:hover {
		background: rgba(123, 144, 75, 0.12);
	}

	.social-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.social-row {
		display: grid;
		grid-template-columns: 1fr 1.5fr auto;
		gap: 0.5rem;
		align-items: start;
	}

	.social-remove {
		background: none;
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		width: 38px;
		height: 38px;
		font-size: 1.1rem;
		cursor: pointer;
		color: var(--color-text);
		opacity: 0.7;
	}

	.social-remove:hover {
		opacity: 1;
		color: #ef4444;
	}

	@media (max-width: 640px) {
		.social-row {
			grid-template-columns: 1fr;
		}
		.social-remove {
			width: 100%;
		}
	}
</style>
