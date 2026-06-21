import { validateEmail, validateStringLength, Limits } from '../shared/validators.js';
import type { ContactFormData } from './types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateContactForm(data: Record<string, unknown>): ValidationResult {
  const name = typeof data.name === 'string' ? data.name : '';
  const email = typeof data.email === 'string' ? data.email : '';
  const subject = typeof data.subject === 'string' ? data.subject : '';
  const message = typeof data.message === 'string' ? data.message : '';

  if (!name) return { valid: false, error: 'Name is required' };
  if (!validateStringLength(name, Limits.name.min, Limits.name.max)) {
    return { valid: false, error: `Name must be between ${Limits.name.min} and ${Limits.name.max} characters` };
  }

  if (!email) return { valid: false, error: 'Email is required' };
  if (!validateEmail(email)) return { valid: false, error: 'Invalid email address' };

  if (!subject) return { valid: false, error: 'Subject is required' };
  if (!validateStringLength(subject, Limits.subject.min, Limits.subject.max)) {
    return { valid: false, error: `Subject must be between ${Limits.subject.min} and ${Limits.subject.max} characters` };
  }

  if (!message) return { valid: false, error: 'Message is required' };
  if (!validateStringLength(message, Limits.message.min, Limits.message.max)) {
    return { valid: false, error: `Message must be between ${Limits.message.min} and ${Limits.message.max} characters` };
  }

  if (data.company !== undefined && data.company !== null && data.company !== '') {
    const company = String(data.company);
    if (company.length > Limits.company.max) {
      return { valid: false, error: `Company must not exceed ${Limits.company.max} characters` };
    }
  }

  return { valid: true };
}

export function toContactFormData(data: Record<string, unknown>): ContactFormData {
  return {
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    company: data.company ? String(data.company) : undefined,
    subject: String(data.subject ?? ''),
    message: String(data.message ?? ''),
  };
}
