/**
 * Lightweight markdown-like parser converting headings, lists, bold text,
 * and links into raw HTML.
 */
export function parseMarkdown(text: string): string {
	let html = text
		.replace(/^### (.*$)/gim, '<h3>$1</h3>')
		.replace(/^## (.*$)/gim, '<h2>$1</h2>')
		.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
		.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
		.replace(/^\* (.*$)/gim, '<li>$1</li>');

	// Wrap consecutive <li> items in <ul>
	html = html.replace(/(<li>.*<\/li>(\n|$))+/gim, (match) => `<ul>${match}</ul>`);

	// Wrap paragraphs
	const lines = html.split(/\n\n+/);
	html = lines
		.map((line) => {
			const trimmed = line.trim();
			if (!trimmed) return '';
			if (/^<(h[23]|ul|li)/.test(trimmed)) return trimmed;
			return `<p>${trimmed}</p>`;
		})
		.filter(Boolean)
		.join('\n');

	return html;
}
