export interface TrustedCompany {
	name: string;
	logo: string;
	website?: string;
	description?: string;
}

export const trustedCompanies: TrustedCompany[] = [
	{
		name: 'Whoami Studios',
		logo: '/assets/companies/whoami.png',
		website: 'https://www.whoamistudios.in/',
		description: 'Handcrafted pop-culture collectibles and custom 3D-printed identity desk decor.'
	},
	{
		name: 'US India Advisory',
		logo: '/assets/companies/usindiaadvisory.png',
		website: 'http://usindiaadvisory.com/',
		description: 'Expert accounting, taxation, and advisory services for cross-border businesses.'
	}
];
