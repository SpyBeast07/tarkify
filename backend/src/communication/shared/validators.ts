const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;
const PHONE_REGEX = /^[\d\s\-().+]{7,20}$/;

export const Limits = {
  name: { min: 1, max: 256 },
  email: { max: 320 },
  subject: { min: 1, max: 512 },
  message: { min: 1, max: 5000 },
  company: { max: 256 },
  product: { min: 1, max: 256 },
  phone: { max: 20 },
  resumeUrl: { max: 2048 },
  portfolioUrl: { max: 2048 },
  coverLetter: { max: 10000 },
} as const;

export function validateEmail(email: string): boolean {
  if (email.length > Limits.email.max) return false;
  return EMAIL_REGEX.test(email);
}

export function validateUrl(url: string): boolean {
  if (url.length > Limits.resumeUrl.max) return false;
  return URL_REGEX.test(url);
}

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function validateStringLength(value: string, min: number, max: number): boolean {
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
