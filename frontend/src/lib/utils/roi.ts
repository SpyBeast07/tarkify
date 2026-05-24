export interface ROISavings {
	hoursSaved: number;
	moneySaved: number;
}

/**
 * Calculates monthly hours and money saved based on manual work hours and team size.
 * Assumes 70% efficiency gain and average $50/hour developer cost.
 */
export function calculateROI(hoursPerWeek: number, teamSize: number): ROISavings {
	const hoursSaved = Math.round(hoursPerWeek * 0.7 * teamSize);
	const moneySaved = hoursSaved * 50;
	return { hoursSaved, moneySaved };
}
