<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { Component } from 'svelte';

	interface Props {
		type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'tel' | 'url' | 'number';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value: any;
		label?: string;
		placeholder?: string;
		error?: string;
		required?: boolean;
		name?: string;
		id?: string;
		options?: string[] | { value: string; label: string }[];
		class?: string;
		icon?: Component<{ size?: number; class?: string }>;
		iconSnippet?: Snippet;
		rows?: number;
	}

	let {
		type = 'text',
		value = $bindable(),
		label,
		placeholder = '',
		error = '',
		required = false,
		name,
		id = name || Math.random().toString(36).substring(2, 9),
		options = [],
		class: className = '',
		icon,
		iconSnippet,
		rows = 4
	}: Props = $props();
</script>

<div class="form-group {className}">
	{#if label}
		<label for={id} class="form-label">{label}</label>
	{/if}

	<div class="input-container-wrapper {icon || iconSnippet ? 'input-with-icon' : ''}">
		{#if iconSnippet}
			{@render iconSnippet()}
		{:else if icon}
			{@const IconComp = icon}
			<IconComp size={20} class="input-icon {type === 'textarea' ? 'top-align' : ''}" />
		{/if}

		{#if type === 'textarea'}
			<textarea
				{id}
				{name}
				{placeholder}
				{required}
				{rows}
				bind:value
				class={error ? 'input-error' : ''}></textarea>
		{:else if type === 'select'}
			<select {id} {name} {required} bind:value class={error ? 'input-error' : ''}>
				{#each options as option (typeof option === 'string' ? option : option.value)}
					{#if typeof option === 'string'}
						<option value={option}>{option}</option>
					{:else}
						<option value={option.value}>{option.label}</option>
					{/if}
				{/each}
			</select>
		{:else}
			<input
				{type}
				{id}
				{name}
				{placeholder}
				{required}
				bind:value
				class={error ? 'input-error' : ''}
			/>
		{/if}
	</div>

	{#if error}
		<span class="error-text">{error}</span>
	{/if}
</div>

<style>
	.error-text {
		color: #ef4444;
		font-size: 0.85rem;
		margin-top: 0.25rem;
		display: block;
	}

	.input-with-icon :global(input),
	.input-with-icon :global(select),
	.input-with-icon :global(textarea) {
		padding-left: 3.5rem !important;
	}

	.input-with-icon :global(.input-icon.top-align) {
		top: 1.25rem;
	}
</style>
