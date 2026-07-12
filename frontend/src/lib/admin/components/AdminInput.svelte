<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date';
		value: any;
		label?: string;
		placeholder?: string;
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
		type = 'text',
		value = $bindable(),
		label,
		placeholder = '',
		error = '',
		required = false,
		disabled = false,
		id = Math.random().toString(36).substring(2, 9),
		class: className = '',
		icon: IconComp,
		...rest
	}: Props = $props();
</script>

<div class="admin-input-group {className}">
	{#if label}
		<label for={id} class="admin-input-label">
			{label}
			{#if required}
				<span class="required-indicator" aria-hidden="true">*</span>
			{/if}
		</label>
	{/if}
	<div class="admin-input-wrapper" class:has-icon={!!IconComp}>
		{#if IconComp}
			<span class="admin-input-icon"><IconComp size={16} /></span>
		{/if}
		<input
			{type}
			{id}
			{placeholder}
			{required}
			{disabled}
			bind:value
			class="admin-input-field"
			class:has-error={!!error}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? `${id}-error` : undefined}
			{...rest}
		/>
	</div>
	{#if error}
		<span class="admin-input-error" id={`${id}-error`}>{error}</span>
	{/if}
</div>

<style>
	.admin-input-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}

	.admin-input-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text);
		opacity: 0.85;
	}

	.required-indicator {
		color: #ef4444;
		margin-left: 0.125rem;
	}

	.admin-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.admin-input-icon {
		position: absolute;
		left: 0.875rem;
		opacity: 0.5;
		display: flex;
		align-items: center;
		pointer-events: none;
	}

	.admin-input-field {
		width: 100%;
		background: rgba(255, 255, 255, 0.45);
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		padding: 0.625rem 0.875rem;
		font-family: var(--font-main);
		font-size: 0.9rem;
		color: var(--color-text);
		transition: var(--transition-smooth);
		outline: none;
	}

	[data-theme='dark'] .admin-input-field {
		background: rgba(0, 36, 0, 0.15);
		color: var(--color-white);
	}

	.admin-input-wrapper.has-icon .admin-input-field {
		padding-left: 2.25rem;
	}

	.admin-input-field:hover:not(:disabled) {
		background: rgba(123, 144, 75, 0.03);
		border-color: rgba(123, 144, 75, 0.3);
	}

	.admin-input-field:focus:not(:disabled) {
		background: rgba(255, 255, 255, 0.6);
		border-color: var(--color-accent-green);
		box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.12);
	}

	[data-theme='dark'] .admin-input-field:focus:not(:disabled) {
		background: rgba(0, 36, 0, 0.25);
		border-color: var(--color-accent-green);
		box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.12);
	}

	.admin-input-field:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: rgba(0, 0, 0, 0.05);
	}

	.admin-input-field.has-error {
		border-color: #ef4444;
	}

	.admin-input-field.has-error:focus {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
	}

	.admin-input-error {
		color: #ef4444;
		font-size: 0.78rem;
		font-weight: 500;
	}
</style>
