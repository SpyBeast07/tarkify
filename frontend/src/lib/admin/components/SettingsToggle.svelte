<script lang="ts">
	interface Props {
		checked: boolean;
		disabled?: boolean;
		label?: string;
		id?: string;
		onchange?: (value: boolean) => void;
	}

	let {
		checked = $bindable(),
		disabled = false,
		label = '',
		id = Math.random().toString(36).substring(2, 9),
		onchange
	}: Props = $props();

	function toggle() {
		if (disabled) return;
		checked = !checked;
		onchange?.(checked);
	}
</script>

<button
	type="button"
	class="settings-toggle"
	class:on={checked}
	class:disabled
	role="switch"
	aria-checked={checked}
	aria-label={label}
	{disabled}
	onclick={toggle}
>
	<span class="settings-toggle-knob" aria-hidden="true"></span>
</button>

<style>
	.settings-toggle {
		position: relative;
		width: 44px;
		height: 24px;
		border-radius: 999px;
		border: 1px solid var(--color-glass-border);
		background: rgba(0, 0, 0, 0.12);
		cursor: pointer;
		padding: 0;
		transition: background 0.2s ease;
		flex-shrink: 0;
	}

	.settings-toggle.on {
		background: var(--color-accent-green);
		border-color: var(--color-accent-green);
	}

	.settings-toggle.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.settings-toggle-knob {
		position: absolute;
		top: 50%;
		left: 3px;
		transform: translateY(-50%);
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #fff;
		transition: left 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
	}

	.settings-toggle.on .settings-toggle-knob {
		left: 23px;
	}
</style>
