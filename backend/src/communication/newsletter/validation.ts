import { validateEmail } from '../shared/validators.js';
import type { NewsletterFormData } from './types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateNewsletterForm(data: Record<string, unknown>): ValidationResult {
  const email = typeof data.email === 'string' ? data.email : '';

  if (!email) return { valid: false, error: 'Email is required' };
  if (!validateEmail(email)) return { valid: false, error: 'Invalid email address' };

  return { valid: true };
}

export function toNewsletterFormData(data: Record<string, unknown>): NewsletterFormData {
  return {
    email: String(data.email ?? ''),
  };
}
