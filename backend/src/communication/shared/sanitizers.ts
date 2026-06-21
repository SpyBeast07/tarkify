const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\son\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript\s*:/gi;

export function stripHtml(input: string): string {
  return input
    .replace(SCRIPT_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(HTML_TAG_REGEX, '')
    .replace(JAVASCRIPT_PROTOCOL_REGEX, '');
}

export function sanitizeText(input: string, maxLength: number): string {
  const cleaned = stripHtml(input);
  const trimmed = cleaned.trim();
  return trimmed.slice(0, maxLength);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeUrl(url: string, maxLength: number): string {
  const cleaned = stripHtml(url);
  const trimmed = cleaned.trim();
  return trimmed.slice(0, maxLength);
}
