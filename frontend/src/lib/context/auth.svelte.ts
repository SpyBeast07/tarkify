import { browser } from '$app/environment';
import { getSession as apiGetSession, type User } from '$lib/api/auth';

const AUTH_CHANNEL = 'tarkify-auth';

export function createAuthState() {
	let user = $state<User | null>(null);
	let currentSessionToken = $state<string | null>(null);
	let loaded = $state(false);
	let checking = false;

	async function checkSession() {
		if (checking) return;
		checking = true;
		try {
			const data = await apiGetSession();
			user = data?.user ?? null;
			currentSessionToken = data?.session?.token ?? null;
		} catch {
			user = null;
			currentSessionToken = null;
		} finally {
			loaded = true;
			checking = false;
		}
	}

	function setUser(u: User | null, sessionToken?: string | null) {
		user = u;
		if (sessionToken !== undefined) currentSessionToken = sessionToken;
		loaded = true;
	}

	function clearUser() {
		user = null;
		currentSessionToken = null;
	}

	function broadcast() {
		if (!browser) return;
		try {
			const channel = new BroadcastChannel(AUTH_CHANNEL);
			channel.postMessage('auth-changed');
			channel.close();
		} catch {
			// BroadcastChannel not supported
		}
	}

	let channel: BroadcastChannel | null = null;

	if (browser) {
		try {
			channel = new BroadcastChannel(AUTH_CHANNEL);
			channel.onmessage = () => {
				checkSession();
			};
		} catch {
			// BroadcastChannel not supported
		}

		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible' && loaded) {
				checkSession();
			}
		});
	}

	function destroy() {
		if (channel) {
			channel.onmessage = null;
			channel.close();
			channel = null;
		}
	}

	return {
		get user() {
			return user;
		},
		get currentSessionToken() {
			return currentSessionToken;
		},
		get loaded() {
			return loaded;
		},
		checkSession,
		setUser,
		clearUser,
		broadcast,
		destroy,
	};
}

export type AuthState = ReturnType<typeof createAuthState>;
