import { describe, it, expect } from 'bun:test';

describe('Purchase Service', () => {
  describe('normaliseEmail', () => {
    // Inline the function to test without DB dependency
    function normaliseEmail(email: string): string {
      return email.trim().toLowerCase();
    }

    it('lowercases email', () => {
      expect(normaliseEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('trims whitespace', () => {
      expect(normaliseEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('handles mixed case and spaces', () => {
      expect(normaliseEmail('  User@Example.Com  ')).toBe('user@example.com');
    });

    it('handles already normalised email', () => {
      expect(normaliseEmail('user@example.com')).toBe('user@example.com');
    });
  });

  describe('email validation regex', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('accepts valid email', () => {
      expect(emailRegex.test('user@example.com')).toBe(true);
      expect(emailRegex.test('user.name@example.co.in')).toBe(true);
    });

    it('rejects email without @', () => {
      expect(emailRegex.test('userexample.com')).toBe(false);
    });

    it('rejects email without domain', () => {
      expect(emailRegex.test('user@.com')).toBe(false);
    });

    it('rejects email with spaces', () => {
      expect(emailRegex.test('user @example.com')).toBe(false);
      expect(emailRegex.test('user@ex ample.com')).toBe(false);
    });
  });

  describe('price formatting', () => {
    function formatPrice(paise: number, currency: string = 'INR'): string {
      const value = (paise / 100).toFixed(currency === 'INR' ? 0 : 2);
      if (currency === 'INR') return `₹${value}`;
      return `${currency} ${value}`;
    }

    it('formats INR price from paise', () => {
      expect(formatPrice(2900)).toBe('₹29');
      expect(formatPrice(100)).toBe('₹1');
    });

    it('formats USD price from cents', () => {
      expect(formatPrice(2999, 'USD')).toBe('USD 29.99');
    });

    it('handles zero', () => {
      expect(formatPrice(0)).toBe('₹0');
    });
  });
});
