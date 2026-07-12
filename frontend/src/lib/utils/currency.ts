const DEFAULT_CURRENCY = 'INR';
const DEFAULT_LOCALE = 'en-IN';

export function paiseToRupees(paise: number): number {
	return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
	return Math.round(rupees * 100);
}

function formatWithIntl(rupees: number, currency: string): string {
	try {
		return new Intl.NumberFormat(DEFAULT_LOCALE, {
			style: 'currency',
			currency: currency || DEFAULT_CURRENCY,
			maximumFractionDigits: 0
		}).format(rupees);
	} catch {
		const value = rupees.toFixed(0);
		return `${currency || DEFAULT_CURRENCY} ${value}`;
	}
}

export function formatPrice(paise: number, currency: string = DEFAULT_CURRENCY): string {
	return formatWithIntl(paise / 100, currency || DEFAULT_CURRENCY);
}

export function formatRupees(rupees: number, currency: string = DEFAULT_CURRENCY): string {
	return formatWithIntl(rupees, currency || DEFAULT_CURRENCY);
}
