type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
	debug: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
}

const isDev = import.meta.env.DEV;

function createLogger(name: string): Logger {
	function log(level: LogLevel, ...args: unknown[]) {
		const prefix = `[${name}]`;

		switch (level) {
			case 'error':
				if (isDev) {
					console.error(prefix, ...args);
				}
				break;
			case 'warn':
				if (isDev) {
					console.warn(prefix, ...args);
				}
				break;
			case 'info':
				if (isDev) {
					console.info(prefix, ...args);
				}
				break;
			case 'debug':
				if (isDev) {
					console.debug(prefix, ...args);
				}
				break;
		}
	}

	return {
		debug: (...args: unknown[]) => log('debug', ...args),
		info: (...args: unknown[]) => log('info', ...args),
		warn: (...args: unknown[]) => log('warn', ...args),
		error: (...args: unknown[]) => log('error', ...args)
	};
}

export const logger = createLogger('Tarkify');
