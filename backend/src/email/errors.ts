/**
 * Email system error hierarchy.
 */

export class EmailError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EmailError';
  }
}

export class EmailProviderError extends EmailError {
  public readonly provider: string;
  public readonly statusCode?: number;

  constructor(provider: string, message: string, statusCode?: number, options?: ErrorOptions) {
    super(`[${provider}] ${message}`, options);
    this.name = 'EmailProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export class EmailConfigurationError extends EmailError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EmailConfigurationError';
  }
}

export class EmailTemplateError extends EmailError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EmailTemplateError';
  }
}

export class EmailRateLimitError extends EmailProviderError {
  public readonly retryAfterMs?: number;

  constructor(provider: string, message: string, retryAfterMs?: number, options?: ErrorOptions) {
    super(provider, message, 429, options);
    this.name = 'EmailRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}
