const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const URL_REGEX = /^https?:\/\/.+/;
const PHONE_REGEX = /^(?=.*\d)[\d \-().+]{7,20}$/;

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
  const trimmed = email.trim();
  if (!trimmed) return false;
  if (trimmed.length > Limits.email.max) return false;
  if (trimmed.includes('..')) return false;
  return EMAIL_REGEX.test(trimmed.toLowerCase());
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
