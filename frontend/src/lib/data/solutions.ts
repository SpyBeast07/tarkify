import solutionsJson from './solutions.json';

export interface SolutionPillar {
	title: string;
	subtitle: string;
	description: string;
	iconName: string;
}

export interface SolutionWorkflow {
	title: string;
	iconName: string;
	steps: string[];
}

export interface SolutionWhyUsPoint {
	title: string;
	description: string;
}

export interface SolutionWhyUs {
	title: string;
	points: SolutionWhyUsPoint[];
}

export interface SolutionProblem {
	title: string;
	points: string[];
}

export interface SolutionTechStack {
	category: string;
	technologies: string[];
}

export interface SolutionComparison {
	headers: string[];
	rows: string[][];
}

export interface SolutionData {
	id: string;
	title: string;
	badge: string;
	description: string;
	price?: string;
	priceDetail?: string;
	iconName: string;
	githubUrl?: string;
	about?: string;
	problem?: SolutionProblem;
	whyUs?: SolutionWhyUs;
	pillars?: SolutionPillar[];
	workflows?: SolutionWorkflow[];
	comparison?: SolutionComparison;
	techStack?: SolutionTechStack[];
	features: string[];
	comingSoon?: boolean;
}

export const solutionsData: SolutionData[] = solutionsJson as SolutionData[];
