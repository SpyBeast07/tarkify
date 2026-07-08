/**
 * Retry strategy for email delivery.
 * Implements exponential backoff with full jitter.
 */

import { EmailProviderError, EmailRateLimitError } from './errors.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 1,
  baseDelayMs: 1_000,
  maxDelayMs: 5_000,
};

export function isRetryableError(error: unknown): boolean {
  if (error instanceof EmailRateLimitError) return true;
  if (error instanceof EmailProviderError) {
    if (error.statusCode === 429 || error.statusCode === 503) return true;
    if (error.statusCode === 500) return true;
    if (error.statusCode === 502) return true;
    if (error.statusCode === 504) return true;
  }
  return false;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  return Math.random() * cappedDelay;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
  isRetryable: (error: unknown) => boolean = isRetryableError
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries || !isRetryable(error)) {
        throw error;
      }

      const delay = calculateDelay(attempt, config);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
