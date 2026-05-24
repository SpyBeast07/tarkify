import { browser } from '$app/environment';

export function createThemeState() {
	let currentTheme = $state<'light' | 'dark'>('light');

	if (browser) {
		const saved = localStorage.getItem('tarkify-theme') as 'light' | 'dark';
		const initial = saved || 'light';
		currentTheme = initial;
		document.documentElement.setAttribute('data-theme', initial);
	}

	function toggleTheme() {
		currentTheme = currentTheme === 'light' ? 'dark' : 'light';
		if (browser) {
			document.documentElement.setAttribute('data-theme', currentTheme);
			localStorage.setItem('tarkify-theme', currentTheme);
		}
	}

	return {
		get theme() {
			return currentTheme;
		},
		toggleTheme
	};
}
