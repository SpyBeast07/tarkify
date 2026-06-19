/**
 * Form Submission Routes
 *
 * Handles contact inquiries, feedback, career applications, and newsletter signups.
 * All submissions are stored in the form_submissions table for audit and processing.
 *
 * POST /api/contact     — Contact form inquiry
 * POST /api/feedback    — Product feedback with star rating
 * POST /api/careers     — Job application
 * POST /api/newsletter  — Newsletter email signup
 */

import { Hono } from 'hono';
import { query } from '../db.js';

const forms = new Hono();

// ── Validation helpers ───────────────────────────────────────────

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Safely parse JSON request body.
 * Returns the parsed body on success, or sends a 400 error response if malformed.
 */
async function safeParseJson<T>(c: any): Promise<{ data: T | null; error: Response | null }> {
  try {
    const data = (await c.req.json()) as T;
    return { data, error: null };
  } catch {
    return { data: null, error: c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON in request body' }, 400) };
  }
}

// ── Contact ──────────────────────────────────────────────────────

forms.post('/contact', async (c) => {
  const { data: body, error } = await safeParseJson<{
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    service?: string;
    message: string;
  }>(c);

  if (error) return error;

  const { firstName, lastName, email, company, service, message } = body!;

  if (!firstName || !lastName || !email || !message) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'firstName, lastName, email, and message are required' }, 400);
  }

  if (!validateEmail(email)) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid email address' }, 400);
  }

  try {
    await query(
      `INSERT INTO form_submissions (form_type, email, payload)
       VALUES ('contact', $1, $2)`,
      [
        email.trim().toLowerCase(),
        JSON.stringify({ firstName, lastName, company: company || null, service: service || null, message }),
      ]
    );

    console.info(`Contact form submission: email=${email}`);
    return c.json({ success: true, message: 'Thank you for your message. We will get back to you within 24 hours.' });
  } catch (error) {
    console.error('Failed to store contact submission:', error);
    return c.json({ error: 'SUBMISSION_FAILED', message: 'Failed to submit form. Please try again.' }, 500);
  }
});

// ── Feedback ─────────────────────────────────────────────────────

forms.post('/feedback', async (c) => {
  const { data: body, error } = await safeParseJson<{
    firstName: string;
    lastName: string;
    email: string;
    product: string;
    feedbackType: string;
    rating: number;
    message: string;
  }>(c);

  if (error) return error;

  const { firstName, lastName, email, product, feedbackType, rating, message } = body!;

  if (!firstName || !email || !product || !feedbackType || rating === undefined || !message) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'firstName, email, product, feedbackType, rating, and message are required' }, 400);
  }

  if (!validateEmail(email)) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid email address' }, 400);
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'Rating must be an integer between 1 and 5' }, 400);
  }

  try {
    await query(
      `INSERT INTO form_submissions (form_type, email, payload)
       VALUES ('feedback', $1, $2)`,
      [
        email.trim().toLowerCase(),
        JSON.stringify({ firstName, lastName: lastName || null, product, feedbackType, rating, message }),
      ]
    );

    console.info(`Feedback submission: email=${email} product=${product} rating=${rating}`);
    return c.json({ success: true, message: 'Thank you for your feedback! It helps us improve.' });
  } catch (error) {
    console.error('Failed to store feedback submission:', error);
    return c.json({ error: 'SUBMISSION_FAILED', message: 'Failed to submit feedback. Please try again.' }, 500);
  }
});

// ── Careers ──────────────────────────────────────────────────────

forms.post('/careers', async (c) => {
  const { data: body, error } = await safeParseJson<{
    name: string;
    email: string;
    phone: string;
    role: string;
    cvLink: string;
    linkedin: string;
    portfolio: string;
    message: string;
  }>(c);

  if (error) return error;

  const { name, email, phone, role, cvLink, linkedin, portfolio, message } = body!;

  if (!name || !email || !phone || !role || !cvLink) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'name, email, phone, role, and cvLink are required' }, 400);
  }

  if (!validateEmail(email)) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid email address' }, 400);
  }

  try {
    await query(
      `INSERT INTO form_submissions (form_type, email, payload)
       VALUES ('careers', $1, $2)`,
      [
        email.trim().toLowerCase(),
        JSON.stringify({ name, phone, role, cvLink, linkedin: linkedin || null, portfolio: portfolio || null, message: message || null }),
      ]
    );

    console.info(`Career application: email=${email} role=${role}`);
    return c.json({ success: true, message: 'Your application has been received. We will be in touch soon.' });
  } catch (error) {
    console.error('Failed to store career submission:', error);
    return c.json({ error: 'SUBMISSION_FAILED', message: 'Failed to submit application. Please try again.' }, 500);
  }
});

// ── Newsletter ───────────────────────────────────────────────────

forms.post('/newsletter', async (c) => {
  const { data: body, error } = await safeParseJson<{ email: string }>(c);
  if (error) return error;
  const { email } = body!;

  if (!email) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'Email is required' }, 400);
  }

  if (!validateEmail(email)) {
    return c.json({ error: 'VALIDATION_ERROR', message: 'Invalid email address' }, 400);
  }

  const normalisedEmail = email.trim().toLowerCase();

  // Check for duplicates before inserting
  const existing = await query(
    'SELECT 1 FROM form_submissions WHERE form_type = $1 AND email = $2 LIMIT 1',
    ['newsletter', normalisedEmail]
  );

  if (existing.rowCount && existing.rowCount > 0) {
    return c.json({ success: true, message: 'You are already subscribed to our newsletter!' });
  }

  try {
    await query(
      `INSERT INTO form_submissions (form_type, email, payload)
       VALUES ('newsletter', $1, '{}'::jsonb)`,
      [normalisedEmail]
    );

    console.info(`Newsletter signup: email=${normalisedEmail}`);
    return c.json({ success: true, message: 'Thank you for subscribing to our newsletter!' });
  } catch (error) {
    console.error('Failed to store newsletter subscription:', error);
    return c.json({ error: 'SUBMISSION_FAILED', message: 'Failed to subscribe. Please try again.' }, 500);
  }
});

export default forms;
