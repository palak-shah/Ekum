import { describe, expect, it } from 'vitest';
import { dispatchSchema } from '@ekum/domain-types';

describe('dispatchSchema', () => {
  it('requires a non-empty LR number', () => {
    expect(dispatchSchema.safeParse({}).success).toBe(false);
    expect(dispatchSchema.safeParse({ lrNumber: '' }).success).toBe(false);
    expect(dispatchSchema.safeParse({ lrNumber: '  ' }).success).toBe(false);
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
