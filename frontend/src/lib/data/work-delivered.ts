export interface WorkTestimonial {
	quote: string;
	author: string;
	role: string;
}

export interface WorkProject {
	/** Unique identifier used as carousel key */
	id: string;
	/** Category tags shown at the top of the card, e.g. "Branding • Custom Website" */
	category: string;
	/** Display name of the client */
	clientName: string;
	/**
	 * Highlight badge shown under the client name, e.g. "+350% online sales".
	 * Use a short, punchy result or achievement.
	 */
	resultBadge?: string;
	/** 2–3 line project intro shown above the tabs */
	summary: string;
	/** The challenge the client faced */
	challenge: string;
	/** How Tarkify solved it */
	solution: string;
	/** Technology stack chips */
	technologies: string[];
	/** Live website URL */
	websiteUrl: string;
	/**
	 * CSS colour value for the left accent panel background.
	 * Pick something that complements Tarkify's green palette.
	 */
	accentColor: string;
	/**
	 * Path under /static (or a full URL) for the screenshot fallback.
	 * Shown while the iframe is loading or when embedding is blocked.
	 */
	screenshotUrl: string;
	/**
	 * Set to false to skip the iframe attempt and always show the screenshot.
	 * Defaults to true.
	 */
	allowIframe?: boolean;
	/** Optional client testimonial shown in the "Client Review" tab */
	testimonial?: WorkTestimonial;
}

export const workProjects: WorkProject[] = [
	{
		id: 'whoami-studios',
		category: 'Branding • Custom Website',
		clientName: 'Whoami Studios',
		resultBadge: '✦ Premium Brand Launch',
		summary:
			'Whoami Studios crafts handmade pop-culture collectibles and custom 3D-printed identity decor. They needed a website as bold and distinctive as their products — one that commanded attention and converted visitors into buyers.',
		challenge:
			'The brand lacked an online presence that matched their premium, identity-driven aesthetic. Without a dedicated website, potential customers were left unimpressed and sales were limited to word-of-mouth.',
		solution:
			'Built a visually striking, performance-optimised website in SvelteKit that puts their products front and center, strengthens brand credibility, and delivers a seamless buying experience on every device.',
		technologies: [
			'SvelteKit',
			'TypeScript',
			'Responsive Design',
			'SEO',
			'Performance Optimisation'
		],
		websiteUrl: 'https://www.whoamistudios.in/',
		accentColor: '#1c3a0d',
		screenshotUrl: '/assets/screenshots/whoamistudios.webp',
		testimonial: {
			quote:
				"The website completely changed how people perceive our brand. It looks premium, loads instantly, and represents exactly who we are. We couldn't be happier with the result.",
			author: 'Founder',
			role: 'Whoami Studios'
		}
	}
];
