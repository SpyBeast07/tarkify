(function () {
	var theme = localStorage.getItem('tarkify-theme');
	if (theme === 'dark') {
		document.documentElement.setAttribute('data-theme', 'dark');
	}
})();
