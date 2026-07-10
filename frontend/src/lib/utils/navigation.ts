import { goto } from '$app/navigation';

export class DebouncedNavigation {
	private timeoutId: ReturnType<typeof setTimeout> | null = null;

	navigate(url: string, delay: number): void {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
		this.timeoutId = setTimeout(() => {
			goto(url);
			this.timeoutId = null;
		}, delay);
	}
}