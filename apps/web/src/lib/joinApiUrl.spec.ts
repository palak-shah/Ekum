import { describe, expect, it } from 'vitest';
import { joinApiUrl } from './apiClient';

describe('joinApiUrl', () => {
  it('resolves relative Docker base against the page origin', () => {
    expect(joinApiUrl('/api/v1', '/auth/otp/request', 'http://localhost:8080')).toBe(
      'http://localhost:8080/api/v1/auth/otp/request',
    );
  });

  it('keeps absolute Vite-dev bases', () => {
    expect(
      joinApiUrl('http://localhost:3000/api/v1', '/auth/otp/request', 'http://localhost:5173'),
    ).toBe('http://localhost:3000/api/v1/auth/otp/request');
  });

  it('does not throw on a bare relative base (BM regression)', () => {
    expect(() => joinApiUrl('/api/v1', '/auth/otp/request', 'http://127.0.0.1:8080')).not.toThrow();
  });
});
