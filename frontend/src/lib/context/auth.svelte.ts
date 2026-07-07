import { browser } from '$app/environment';
import { getSession as apiGetSession, type User } from '$lib/api/auth';

const AUTH_CHANNEL = 'tarkify-auth';

export function createAuthState() {
	let user = $state<User | null>(null);
	let loaded = $state(false);
	let checking = false;

	async function checkSession() {
		if (checking) return;
		checking = true;
		try {
			const data = await apiGetSession();
			user = data?.user ?? null;
		} catch {
			user = null;
		} finally {
			loaded = true;
			checking = false;
		}
	}

	function setUser(u: User | null) {
		user = u;
		loaded = true;
	}

	function clearUser() {
		user = null;
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

	if (browser) {
		try {
			const channel = new BroadcastChannel(AUTH_CHANNEL);
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

	return {
		get user() {
			return user;
		},
		get loaded() {
			return loaded;
		},
		checkSession,
		setUser,
		clearUser,
		broadcast,
	};
}

export type AuthState = ReturnType<typeof createAuthState>;
