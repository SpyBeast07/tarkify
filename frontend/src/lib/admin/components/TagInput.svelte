<script lang="ts">
	import { X } from '@lucide/svelte';

	interface Props {
		tags: string[];
		label?: string;
		placeholder?: string;
		error?: string;
		id?: string;
	}

	let { tags = $bindable(), label = 'Tags', placeholder = 'Add a tag...', error = '', id = 'tag-input' }: Props = $props();

	let inputValue = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	function addTag() {
		const trimmed = inputValue.trim();
		if (trimmed && !tags.includes(trimmed)) {
			tags = [...tags, trimmed];
		}
		inputValue = '';
		inputEl?.focus();
	}

	function removeTag(tag: string) {
		tags = tags.filter(t => t !== tag);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		}
		if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
			tags = tags.slice(0, -1);
		}
	}
</script>

<div class="tag-input-group">
	{#if label}
		<label for={id} class="form-label">{label}</label>
	{/if}
	<div class="tag-input-wrapper" class:has-error={!!error}>
		{#each tags as tag}
			<span class="tag-badge">
				{tag}
				<button type="button" class="tag-remove" onclick={() => removeTag(tag)} aria-label="Remove {tag}">
					<X size={12} />
				</button>
			</span>
		{/each}
		<input
			bind:this={inputEl}
			{id}
			type="text"
			bind:value={inputValue}
			{placeholder}
			onkeydown={handleKeydown}
			class="tag-input"
			aria-label={label}
		/>
	</div>
	{#if error}
		<span class="error-text">{error}</span>
	{/if}
</div>

<style>
	.tag-input-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-label {
		font-size: 0.85rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.tag-input-wrapper {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		transition: var(--transition-smooth);
	}

	.tag-input-wrapper:focus-within {
		border-color: var(--color-primary-green);
		box-shadow: 0 0 0 3px rgba(39, 59, 9, 0.1);
	}

	.has-error {
		border-color: #ef4444;
	}

	.tag-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.15rem 0.5rem;
		background: rgba(39, 59, 9, 0.1);
		border-radius: 6px;
		font-size: 0.8rem;
	}

	.tag-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		opacity: 0.5;
		transition: opacity 0.2s;
		color: inherit;
	}

	.tag-remove:hover {
		opacity: 1;
	}

	.tag-input {
		flex: 1;
		min-width: 100px;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.9rem;
		color: var(--color-text);
		padding: 0.125rem 0;
	}

	.tag-input::placeholder {
		opacity: 0.4;
	}

	.error-text {
		color: #ef4444;
		font-size: 0.85rem;
	}
</style>
