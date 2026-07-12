<script lang="ts">
	interface Props {
		checked: boolean;
		label?: string;
		disabled?: boolean;
		id?: string;
		class?: string;
	}

	let {
		checked = $bindable(),
		label = '',
		disabled = false,
		id = Math.random().toString(36).substring(2, 9),
		class: className = ''
	}: Props = $props();
</script>

<label class="admin-checkbox-label {className}" class:disabled>
	<input
		type="checkbox"
		{id}
		{disabled}
		bind:checked
		class="admin-checkbox-input"
	/>
	<span class="admin-checkbox-custom" aria-hidden="true">
		<svg
			width="10"
			height="10"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="4"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	</span>
	{#if label}
		<span class="admin-checkbox-text">{label}</span>
	{/if}
</label>

<style>
	.admin-checkbox-label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text);
		user-select: none;
	}

	.admin-checkbox-label.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.admin-checkbox-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.admin-checkbox-custom {
		width: 18px;
		height: 18px;
		border: 1px solid var(--color-glass-border);
		background: rgba(255, 255, 255, 0.4);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-smooth);
		flex-shrink: 0;
	}

	:global([data-theme='dark']) .admin-checkbox-custom {
		background: rgba(0, 36, 0, 0.15);
	}

	.admin-checkbox-custom svg {
		color: #fff;
		transform: scale(0);
		transition: transform 0.15s ease-in-out;
	}

	.admin-checkbox-input:checked + .admin-checkbox-custom {
		background: var(--color-accent-green);
		border-color: var(--color-accent-green);
	}

	.admin-checkbox-input:checked + .admin-checkbox-custom svg {
		transform: scale(1);
	}

	.admin-checkbox-input:focus-visible + .admin-checkbox-custom {
		box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.25);
		border-color: var(--color-accent-green);
	}

	.admin-checkbox-text {
		opacity: 0.9;
	}
</style>
