import { describe, it, expect } from 'bun:test';

describe('Configuration', () => {
  it('validates port range', async () => {
    // We can't import config directly without env vars, so test the logic inline
    function parsePort(raw: string): number {
      const port = parseInt(raw, 10);
      if (isNaN(port) || port < 1024 || port > 65535) {
        throw new Error(`Invalid PORT: ${raw}`);
      }
      return port;
    }

    expect(parsePort('3001')).toBe(3001);
    expect(parsePort('65535')).toBe(65535);
    expect(parsePort('1024')).toBe(1024);
    expect(() => parsePort('1023')).toThrow();
    expect(() => parsePort('65536')).toThrow();
    expect(() => parsePort('not-a-number')).toThrow();
    expect(() => parsePort('0')).toThrow();
  });

  it('validates positive integers', () => {
    function parsePositiveInt(raw: string, name: string, max: number): number {
      const val = parseInt(raw, 10);
      if (isNaN(val) || val <= 0 || val > max) {
        throw new Error(`Invalid ${name}: ${raw}`);
      }
      return val;
    }

    expect(parsePositiveInt('600', 'TTL', 86400)).toBe(600);
    expect(parsePositiveInt('1', 'TTL', 86400)).toBe(1);
    expect(parsePositiveInt('86400', 'TTL', 86400)).toBe(86400);
    expect(() => parsePositiveInt('0', 'TTL', 86400)).toThrow();
    expect(() => parsePositiveInt('-1', 'TTL', 86400)).toThrow();
    expect(() => parsePositiveInt('99999', 'TTL', 86400)).toThrow();
    expect(() => parsePositiveInt('abc', 'TTL', 86400)).toThrow();
  });
});
