import { describe, it, expect, beforeEach } from 'bun:test';
import app from '../src/index.ts';
import { mockDb } from './helpers.ts';

describe('Communication Modules API Routes', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('POST /api/contact', () => {
    it('creates a contact submission successfully', async () => {
      // Mock DB: insert contact submission returns row
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [{ id: 'contact_123' }], rowCount: 1 })
      );

      const res = await app.request('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme Corp',
          subject: 'General Inquiry',
          message: 'Hello, I would like to learn more.',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data.message).toContain('Thank you');
    });

    it('rejects contact submission if name is missing', async () => {
      const res = await app.request('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'jane@example.com',
          message: 'Hello!',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Name');
    });

    it('sanitizes HTML input in name and message field', async () => {
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [{ id: 'contact_123' }], rowCount: 1 })
      );

      const res = await app.request('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane <script>alert(1)</script>Doe',
          email: 'jane@example.com',
          subject: 'Inquiry',
          message: 'Hello <b>World</b>',
        }),
      });

      expect(res.status).toBe(200);

      // Verify that sanitization occurred (script/HTML elements stripped before DB write)
      const insertQuery = mockDb.queries.find((q) => q.text.includes('INSERT INTO'));
      expect(insertQuery).toBeDefined();
      expect(insertQuery!.params).toBeDefined();
      expect(insertQuery!.params![0]).toBe('Jane Doe'); // name parameter has script stripped
      expect(insertQuery!.params![4]).toBe('Hello World'); // message parameter has bold stripped
    });
  });

  describe('POST /api/newsletter', () => {
    it('creates a newsletter subscription successfully', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('INSERT INTO newsletter_subscribers')) {
          return Promise.resolve({ rows: [{ id: 'newsletter_123', email: 'test@example.com' }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data.message).toContain('Thank you for subscribing');
    });

    it('handles duplicate newsletter subscription silently returning 200', async () => {
      // Mock DB: tryInsertSubscriber returns 0 rows (on conflict do nothing returns empty)
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('INSERT INTO newsletter_subscribers')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data.message).toContain('already subscribed');
    });

    it('rejects subscription with invalid email', async () => {
      const res = await app.request('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/feedback', () => {
    it('submits valid feedback successfully', async () => {
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [{ id: 'feedback_123' }], rowCount: 1 })
      );

      const res = await app.request('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          product: 'devbeast',
          rating: 5,
          message: 'Excellent DevOps controller!',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
    });

    it('rejects feedback with invalid ratings', async () => {
      const res = await app.request('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          product: 'devbeast',
          rating: 6, // invalid max rating
          message: 'Great!',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('rating');
    });
  });

  describe('POST /api/careers', () => {
    it('accepts a valid careers application successfully', async () => {
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [{ id: 'app_123' }], rowCount: 1 })
      );

      const res = await app.request('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'Full Stack Developer',
          name: 'Candidate name',
          email: 'candidate@example.com',
          phone: '+919999999999',
          cvLink: 'https://docs.google.com/document/cv',
          portfolioUrl: 'https://github.com/candidate',
          coverLetter: 'I am excited to join.',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
    });

    it('rejects career application with invalid phone number', async () => {
      const res = await app.request('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'Full Stack Developer',
          name: 'Candidate',
          email: 'candidate@example.com',
          phone: 'not-a-phone-number', // invalid length / chars for phone
          cvLink: 'https://docs.google.com/document/cv',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Phone');
    });

    it('rejects career application with invalid cvLink url format', async () => {
      const res = await app.request('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'Full Stack Developer',
          name: 'Candidate',
          email: 'candidate@example.com',
          phone: '+919999999999',
          cvLink: 'invalid-url', // cvLink must be valid URL structure
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Resume');
    });
  });
});
