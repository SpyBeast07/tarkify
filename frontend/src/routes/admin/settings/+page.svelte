<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import {
		CreditCard,
		Bell
	} from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { getAllSettings, updateSettings, AdminApiError } from '$lib/admin/api/settings';
	import { SETTINGS_SECTIONS } from '$lib/admin/types/settings';
	import type { SettingsGroup } from '$lib/admin/types/settings';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import SettingsSection from '$lib/admin/components/SettingsSection.svelte';
	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';

	const ICONS: Record<SettingsGroup, Component<any>> = {
		payments: CreditCard,
		notifications: Bell
	};

	type GroupState = {
		saving: boolean;
		success: boolean;
		error: string | null;
	};

	let saved = $state<Record<string, any> | null>(null);
	let draft = $state<Record<string, any> | null>(null);
	let active = $state<SettingsGroup>('payments');
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let states = $state<Record<string, GroupState>>({});

	const activeSection = $derived(SETTINGS_SECTIONS.find((s) => s.id === active)!);

	function clone<T>(value: T): T {
		return JSON.parse(JSON.stringify(value)) as T;
	}

	function isDirty(group: SettingsGroup): boolean {
		if (!saved || !draft) return false;
		return JSON.stringify(saved[group]) !== JSON.stringify(draft[group]);
	}

	const anyDirty = $derived(saved && draft ? SETTINGS_SECTIONS.some((s) => isDirty(s.id)) : false);

	const activeState = $derived(states[active] ?? { saving: false, success: false, error: null });

	async function load() {
		loading = true;
		loadError = null;
		try {
			const data = await getAllSettings();
			saved = clone(data as unknown as Record<string, any>);
			draft = clone(data as unknown as Record<string, any>);
		} catch (err) {
			loadError = err instanceof AdminApiError ? err.message : 'Failed to load settings';
		} finally {
			loading = false;
		}
	}

	async function saveSection(group: SettingsGroup) {
		if (!draft) return;
		states[group] = { saving: true, success: false, error: null };
		try {
			const res = await updateSettings(group, draft[group]);
			const updated = (res as any)[group] ?? draft[group];
			saved = { ...saved, [group]: clone(updated) };
			draft = { ...draft, [group]: clone(updated) };
			states[group] = { saving: false, success: true, error: null };
			setTimeout(() => {
				if (states[group]?.success) {
					states[group] = { ...states[group], success: false };
				}
			}, 2500);
		} catch (err) {
			const message = err instanceof AdminApiError ? err.message : 'Failed to save settings';
			states[group] = { saving: false, success: false, error: message };
		}
	}

	function resetSection(group: SettingsGroup) {
		if (!saved) return;
		draft = { ...draft, [group]: clone(saved[group]) };
		states[group] = { saving: false, success: false, error: null };
	}

	function selectSection(group: SettingsGroup) {
		active = group;
	}

	function beforeUnloadHandler(e: BeforeUnloadEvent) {
		if (anyDirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	beforeNavigate((nav) => {
		if (anyDirty && !nav.willUnload) {
			const confirmLeave = window.confirm('You have unsaved changes. Leave without saving?');
			if (!confirmLeave) nav.cancel();
		}
	});

	onMount(() => {
		load();
		window.addEventListener('beforeunload', beforeUnloadHandler);
	});

	onDestroy(() => {
		window.removeEventListener('beforeunload', beforeUnloadHandler);
	});
</script>

<svelte:head>
	<title>Platform Settings | Tarkify Admin</title>
</svelte:head>

<AdminPageContainer>
	<AdminPageHeader
		title="Platform Settings"
		description="Manage runtime application configuration. Secrets and deployment settings are managed outside the app."
	/>

	<AdminPage {loading} error={loadError} onRetry={load}>
		{#if saved && draft}
			<div class="settings-layout">
				<nav class="settings-nav" aria-label="Platform Settings sections">
					{#each SETTINGS_SECTIONS as section (section.id)}
						{@const SectionIcon = ICONS[section.id]}
						<button
							class="settings-nav-item"
							class:active={active === section.id}
							aria-current={active === section.id ? 'page' : undefined}
							onclick={() => selectSection(section.id)}
						>
							<SectionIcon size={18} aria-hidden="true" />
							<span>{section.label}</span>
							{#if isDirty(section.id)}
								<span class="dirty-dot" aria-label="Unsaved changes" title="Unsaved changes"></span>
							{/if}
						</button>
					{/each}
				</nav>

				<div class="settings-content">
					<SettingsSection
						section={activeSection}
						bind:values={draft[active]}
						dirty={isDirty(active)}
						saving={activeState.saving}
						success={activeState.success}
						error={activeState.error}
						onSave={() => saveSection(active)}
						onReset={() => resetSection(active)}
					/>
				</div>
			</div>
		{/if}
	</AdminPage>
</AdminPageContainer>

<style>
	.settings-layout {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 1.5rem;
		align-items: start;
	}

	.settings-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		position: sticky;
		top: 1rem;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 16px;
		padding: 0.75rem;
		backdrop-filter: var(--glass-blur);
	}

	.settings-nav-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.55rem 0.75rem;
		border-radius: 10px;
		border: none;
		background: none;
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		opacity: 0.7;
		text-align: left;
		transition: all 0.15s ease;
	}

	.settings-nav-item:hover {
		background: rgba(255, 255, 255, 0.25);
		opacity: 0.9;
	}

	.settings-nav-item.active {
		background: rgba(123, 144, 75, 0.12);
		color: var(--color-accent-green);
		opacity: 1;
		font-weight: 600;
	}

	.dirty-dot {
		margin-left: auto;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #f59e0b;
	}

	@media (max-width: 768px) {
		.settings-layout {
			grid-template-columns: 1fr;
		}

		.settings-nav {
			position: static;
			flex-direction: row;
			flex-wrap: wrap;
		}

		.settings-nav-item {
			flex: 1 1 auto;
		}
	}
</style>
