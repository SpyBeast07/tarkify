<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		value: any;
		label?: string;
		options?: string[] | { value: any; label: string }[];
		error?: string;
		required?: boolean;
		disabled?: boolean;
		id?: string;
		class?: string;
		icon?: Component<{ size?: number; class?: string }>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	}

	let {
		value = $bindable(),
		label,
		options = [],
		error = '',
		required = false,
		disabled = false,
		id = Math.random().toString(36).substring(2, 9),
		class: className = '',
		icon: IconComp,
		...rest
	}: Props = $props();
</script>

<div class="admin-select-group {className}">
	{#if label}
		<label for={id} class="admin-select-label">
			{label}
			{#if required}
				<span class="required-indicator" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}
	<div class="admin-select-wrapper" class:has-icon={!!IconComp}>
		{#if IconComp}
			<span class="admin-select-icon"><IconComp size={16} /></span>
		{/if}
		<select
			{id}
			{required}
			{disabled}
			bind:value
			class="admin-select-field"
			class:has-error={!!error}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? `${id}-error` : undefined}
			{...rest}
		>
			{#each options as option (typeof option === 'string' ? option : option.value)}
				{#if typeof option === 'string'}
					<option value={option}>{option}</option>
				{:else}
					<option value={option.value}>{option.label}</option>
				{/if}
			{/each}
		</select>
		<span class="select-chevron-icon" aria-hidden="true">
			<svg
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</span>
	</div>
	{#if error}
		<span class="admin-select-error" id={`${id}-error`}>{error}</span>
	{/if}
</div>

<style>
	.admin-select-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}

	.admin-select-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text);
		opacity: 0.85;
	}

	.required-indicator {
		color: #ef4444;
		margin-left: 0.125rem;
	}

	.admin-select-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.admin-select-icon {
		position: absolute;
		left: 0.875rem;
		opacity: 0.5;
		display: flex;
		align-items: center;
		pointer-events: none;
	}

	.admin-select-field {
		width: 100%;
		background: rgba(255, 255, 255, 0.45);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		padding: 0.625rem 2.25rem 0.625rem 0.875rem;
		font-family: var(--font-main);
		font-size: 0.9rem;
		color: var(--color-text);
		transition: var(--transition-smooth);
		outline: none;
		appearance: none;
		cursor: pointer;
	}

	:global([data-theme='dark']) .admin-select-field {
		background: rgba(0, 36, 0, 0.15);
		color: var(--color-white);
	}

	:global([data-theme='dark']) .admin-select-field option {
		background: var(--color-light-bg);
		color: var(--color-text);
	}

	.admin-select-wrapper.has-icon .admin-select-field {
		padding-left: 2.25rem;
	}

	.select-chevron-icon {
		position: absolute;
		right: 0.875rem;
		opacity: 0.5;
		pointer-events: none;
		display: flex;
		align-items: center;
	}

	.admin-select-field:hover:not(:disabled) {
		background: rgba(123, 144, 75, 0.03);
		border-color: rgba(123, 144, 75, 0.3);
	}

	.admin-select-field:focus:not(:disabled) {
		background: rgba(255, 255, 255, 0.6);
		border-color: var(--color-accent-green);
		box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.12);
	}

	:global([data-theme='dark']) .admin-select-field:focus:not(:disabled) {
		background: rgba(0, 36, 0, 0.25);
		border-color: var(--color-accent-green);
		box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.12);
	}

	.admin-select-field:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: rgba(0, 0, 0, 0.05);
	}

	.admin-select-field.has-error {
		border-color: #ef4444;
	}

	.admin-select-field.has-error:focus {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
	}

	.admin-select-error {
		color: #ef4444;
		font-size: 0.78rem;
		font-weight: 500;
	}
</style>
