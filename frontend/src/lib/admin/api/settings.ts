import { adminFetch, AdminApiError } from './client';
import type { AllSettings, SettingsGroup } from '$lib/admin/types/settings';

export async function getAllSettings(): Promise<AllSettings> {
	return adminFetch<AllSettings>('/settings');
}

export async function getSettings<K extends SettingsGroup>(group: K): Promise<AllSettings[K]> {
	return adminFetch<AllSettings[K]>(`/settings/${group}`);
}

export async function updateSettings<K extends SettingsGroup>(
	group: K,
	data: AllSettings[K]
): Promise<{ success: boolean } & Record<K, AllSettings[K]>> {
	return adminFetch<{ success: boolean } & Record<K, AllSettings[K]>>(`/settings/${group}`, {
		method: 'PUT',
		body: JSON.stringify(data)
	});
}

export { AdminApiError };
