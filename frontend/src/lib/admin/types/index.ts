export interface AdminUser {
	id: string;
	name: string;
	email: string;
	image: string | null;
	role: string;
}

export interface AdminSession {
	id: string;
	token: string;
	expiresAt: string;
}

export interface AdminBreadcrumb {
	label: string;
	href: string;
}

export interface NavItem {
	href: string;
	label: string;
	icon?: string;
	children?: NavItem[];
	exact?: boolean;
}

export interface PageHeader {
	title: string;
	description?: string;
	actions?: Array<{
		label: string;
		href?: string;
		onclick?: () => void;
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	}>;
}
