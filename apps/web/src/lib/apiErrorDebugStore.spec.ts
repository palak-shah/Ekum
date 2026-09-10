import { describe, expect, it } from 'vitest';
import { formatApiErrorDebug } from './apiErrorDebugStore';

describe('formatApiErrorDebug', () => {
  it('renders method path status and details for the on-screen dump', () => {
    const text = formatApiErrorDebug({
      source: 'ekum.api',
      method: 'POST',
      path: '/orders',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Photo isn’t ready yet. Remove it and add it again.',
      details: { fieldErrors: { items: ['Invalid url'] } },
      envelopePath: '/api/v1/orders',
    });
    expect(text).toContain('POST /orders → 400 VALIDATION_ERROR');
    expect(text).toContain('Invalid url');
    expect(text).toContain('/api/v1/orders');
  });
});
