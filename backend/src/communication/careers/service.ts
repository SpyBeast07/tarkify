import { sanitizeText, sanitizeUrl, normalizeEmail } from '../shared/sanitizers.js';
import { Limits } from '../shared/validators.js';
import { validateCareerForm, toCareerFormData } from './validation.js';
import { insertCareerApplication } from './repository.js';
import type { CareerApplication } from './types.js';

export interface CareerServiceResult {
  success: boolean;
  error?: string;
  data?: CareerApplication;
}

export async function submitCareerApplication(
  body: Record<string, unknown>,
  ip: string | null,
  userAgent: string | null
): Promise<CareerServiceResult> {
  const validation = validateCareerForm(body);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const raw = toCareerFormData(body);

  const sanitized = {
    name: sanitizeText(raw.name, Limits.name.max),
    email: normalizeEmail(raw.email),
    phone: sanitizeText(raw.phone, Limits.phone.max),
    resumeUrl: sanitizeUrl(raw.resume_url, Limits.resumeUrl.max),
    portfolioUrl: raw.portfolio_url ? sanitizeUrl(raw.portfolio_url, Limits.portfolioUrl.max) : null,
    coverLetter: raw.cover_letter ? sanitizeText(raw.cover_letter, Limits.coverLetter.max) : null,
  };

  const record = await insertCareerApplication(
    sanitized.name,
    sanitized.email,
    sanitized.phone,
    sanitized.resumeUrl,
    sanitized.portfolioUrl,
    sanitized.coverLetter,
    ip,
    userAgent
  );

  return { success: true, data: record };
}
