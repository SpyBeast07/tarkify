import { validateEmail, validateStringLength, validateRating, Limits } from '../shared/validators.js';
import type { FeedbackFormData } from './types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFeedbackForm(data: Record<string, unknown>): ValidationResult {
  const product = typeof data.product === 'string' ? data.product : '';
  const message = typeof data.message === 'string' ? data.message : '';

  if (!product) return { valid: false, error: 'Product is required' };
  if (!validateStringLength(product, Limits.product.min, Limits.product.max)) {
    return { valid: false, error: `Product must be between ${Limits.product.min} and ${Limits.product.max} characters` };
  }

  const rating = typeof data.rating === 'number' ? data.rating : NaN;
  if (!validateRating(rating)) {
    return { valid: false, error: 'Rating must be an integer between 1 and 5' };
  }

  if (!message) return { valid: false, error: 'Message is required' };
  if (!validateStringLength(message, Limits.message.min, Limits.message.max)) {
    return { valid: false, error: `Message must be between ${Limits.message.min} and ${Limits.message.max} characters` };
  }

  if (data.name !== undefined && data.name !== null && data.name !== '') {
    const name = String(data.name);
    if (!validateStringLength(name, Limits.name.min, Limits.name.max)) {
      return { valid: false, error: `Name must be between ${Limits.name.min} and ${Limits.name.max} characters` };
    }
  }

  if (data.email !== undefined && data.email !== null && data.email !== '') {
    const email = String(data.email);
    if (!validateEmail(email)) return { valid: false, error: 'Invalid email address' };
  }

  return { valid: true };
}

export function toFeedbackFormData(data: Record<string, unknown>): FeedbackFormData {
  return {
    name: data.name ? String(data.name) : undefined,
    email: data.email ? String(data.email) : undefined,
    product: String(data.product ?? ''),
    rating: Number(data.rating),
    message: String(data.message ?? ''),
  };
}
