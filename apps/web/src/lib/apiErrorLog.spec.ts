import { describe, expect, it, vi } from 'vitest';
import {
  buildApiErrorLog,
  logApiError,
  shouldLogApiError,
} from './apiErrorLog';

describe('apiErrorLog', () => {
  it('builds a structured developer payload', () => {
    expect(
      buildApiErrorLog({
        method: 'POST',
        path: '/orders',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Photo isn’t ready yet. Remove it and add it again.',
        details: { fieldErrors: { items: ['Invalid url'] } },
        envelopePath: '/api/v1/orders',
      }),
    ).toEqual({
      source: 'ekum.api',
      method: 'POST',
      path: '/orders',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Photo isn’t ready yet. Remove it and add it again.',
      details: { fieldErrors: { items: ['Invalid url'] } },
      envelopePath: '/api/v1/orders',
    });
  });

  it('skips expected auth-refresh 401s', () => {
    expect(shouldLogApiError({ statusCode: 401, willRetryAuth: true })).toBe(false);
    expect(shouldLogApiError({ statusCode: 401, willRetryAuth: false })).toBe(true);
    expect(shouldLogApiError({ statusCode: 400, willRetryAuth: false })).toBe(true);
  });

  it('writes through console.error by default', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const payload = buildApiErrorLog({
      method: 'GET',
      path: '/orders',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    });
    logApiError(payload);
    expect(spy).toHaveBeenCalledWith(payload);
    spy.mockRestore();
  });
});
