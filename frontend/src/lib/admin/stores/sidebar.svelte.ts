import { browser } from '$app/environment';

export function createSidebarState() {
	let mobileOpen = $state(false);

	function toggleMobile() {
		mobileOpen = !mobileOpen;
	}

	function closeMobile() {
		mobileOpen = false;
	}

	return {
		get mobileOpen() {
			return mobileOpen;
		},
		toggleMobile,
		closeMobile
	};
}

export type SidebarState = ReturnType<typeof createSidebarState>;
