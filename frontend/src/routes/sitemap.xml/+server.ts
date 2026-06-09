import { solutionsData } from '$lib/data/solutions';
import { discoverData } from '$lib/data/discover';

const STATIC_PAGES = [
	{ path: '', priority: '1.0', changefreq: 'weekly' },
	{ path: '/solutions', priority: '0.9', changefreq: 'weekly' },
	{ path: '/discover', priority: '0.8', changefreq: 'weekly' },
	{ path: '/careers', priority: '0.6', changefreq: 'monthly' },
	{ path: '/contact', priority: '0.6', changefreq: 'monthly' },
	{ path: '/privacy', priority: '0.3', changefreq: 'monthly' },
	{ path: '/terms', priority: '0.3', changefreq: 'monthly' },
	{ path: '/account', priority: '0.5', changefreq: 'monthly' }
];

export function GET({ url }) {
	const site = url.origin;

	const dynamicPages = [
		...solutionsData.map((s) => ({
			path: `/solutions/${s.id}`,
			priority: '0.8',
			changefreq: 'monthly' as const
		})),
		...discoverData.map((a) => ({
			path: `/discover/${a.slug}`,
			priority: '0.7',
			changefreq: 'monthly' as const
		}))
	];

	const allPages = [...STATIC_PAGES, ...dynamicPages];

	const urls = allPages
		.map(
			(p) => `  <url>
    <loc>${site}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
		)
		.join('\n');

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
}
