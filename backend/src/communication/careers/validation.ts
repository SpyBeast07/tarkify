import { validateEmail, validateStringLength, validatePhone, validateUrl, Limits } from '../shared/validators.js';
import type { CareerFormData } from './types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCareerForm(data: Record<string, unknown>): ValidationResult {
  const name = typeof data.name === 'string' ? data.name : '';
  const email = typeof data.email === 'string' ? data.email : '';
  const phone = typeof data.phone === 'string' ? data.phone : '';
  const resumeUrl = typeof data.resume_url === 'string' ? data.resume_url : '';

  if (!name) return { valid: false, error: 'Name is required' };
  if (!validateStringLength(name, Limits.name.min, Limits.name.max)) {
    return { valid: false, error: `Name must be between ${Limits.name.min} and ${Limits.name.max} characters` };
  }

  if (!email) return { valid: false, error: 'Email is required' };
  if (!validateEmail(email)) return { valid: false, error: 'Invalid email address' };

  if (!phone) return { valid: false, error: 'Phone is required' };
  if (!validatePhone(phone)) return { valid: false, error: 'Invalid phone number' };

  if (!resumeUrl) return { valid: false, error: 'Resume URL is required' };
  if (!validateUrl(resumeUrl)) return { valid: false, error: 'Invalid resume URL. Must start with http:// or https://' };

  if (data.portfolio_url !== undefined && data.portfolio_url !== null && data.portfolio_url !== '') {
    const portfolioUrl = String(data.portfolio_url);
    if (!validateUrl(portfolioUrl)) {
      return { valid: false, error: 'Invalid portfolio URL. Must start with http:// or https://' };
    }
  }

  if (data.cover_letter !== undefined && data.cover_letter !== null && data.cover_letter !== '') {
    const coverLetter = String(data.cover_letter);
    if (coverLetter.length > Limits.coverLetter.max) {
      return { valid: false, error: `Cover letter must not exceed ${Limits.coverLetter.max} characters` };
    }
  }

  return { valid: true };
}

export function toCareerFormData(data: Record<string, unknown>): CareerFormData {
  return {
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    resume_url: String(data.resume_url ?? ''),
    portfolio_url: data.portfolio_url ? String(data.portfolio_url) : undefined,
    cover_letter: data.cover_letter ? String(data.cover_letter) : undefined,
  };
}
