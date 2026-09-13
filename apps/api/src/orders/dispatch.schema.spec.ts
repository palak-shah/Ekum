import { describe, expect, it } from 'vitest';
import { dispatchSchema } from '@ekum/domain-types';

describe('dispatchSchema', () => {
  it('allows dispatch without LR', () => {
    expect(dispatchSchema.safeParse({}).success).toBe(true);
    expect(dispatchSchema.safeParse({ lrNumber: '' }).success).toBe(true);
    expect(dispatchSchema.safeParse({ lrNumber: '  ' }).success).toBe(true);
  });

  it('accepts LR with optional transporter and parcels', () => {
    const parsed = dispatchSchema.safeParse({
      lrNumber: 'LR-99',
      transporter: 'VRL',
      parcelCount: 2,
    });
    expect(parsed.success).toBe(true);
  });
});
