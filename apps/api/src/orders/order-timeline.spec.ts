import { describe, expect, it } from 'vitest';
import { agreementStepLabel, buildOrderTimelineSteps } from '@ekum/domain-types';

const base = {
  createdAt: '2026-08-11T01:00:00.000Z',
  confirmedAt: null as string | null,
  confirmedByName: null as string | null,
  confirmedByRole: null as 'buyer' | 'seller' | null,
  deliveredAt: null as string | null,
  closedAt: null as string | null,
  updatedAt: '2026-08-11T02:00:00.000Z',
  partiallyShipped: false,
  dispatch: null as { dispatchedAt: string | null } | null,
};

describe('agreementStepLabel', () => {
  it('uses Quote accepted when the buyer locked the order', () => {
    expect(agreementStepLabel('buyer', 'you')).toBe('Quote accepted by you');
    expect(agreementStepLabel('buyer', 'Jaipur Emporium')).toBe(
      'Quote accepted by Jaipur Emporium',
    );
    expect(agreementStepLabel('buyer', null)).toBe('Quote accepted');
  });

  it('uses Confirmed when the seller locked the order', () => {
    expect(agreementStepLabel('seller', 'you')).toBe('Confirmed by you');
    expect(agreementStepLabel('seller', 'Surat Silk House')).toBe(
      'Confirmed by Surat Silk House',
    );
    expect(agreementStepLabel('seller', null)).toBe('Confirmed');
  });
});

describe('buildOrderTimelineSteps', () => {
  it('ends with Cancelled after confirm (no dispatch/deliver tail)', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'cancelled',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      confirmedByName: 'you',
      confirmedByRole: 'buyer',
      closedAt: '2026-08-11T02:00:00.000Z',
    });
    expect(steps.map((s) => s.key)).toEqual(['requested', 'confirmed', 'cancelled']);
    expect(steps[1]?.label).toBe('Quote accepted by you');
    expect(steps.at(-1)).toMatchObject({
      label: 'Cancelled',
      done: true,
      current: true,
      at: '2026-08-11T02:00:00.000Z',
    });
  });

  it('shows Declined without a confirmed step when never confirmed', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'declined',
      closedAt: '2026-08-11T01:15:00.000Z',
    });
    expect(steps.map((s) => s.key)).toEqual(['requested', 'declined']);
    expect(steps[1]?.label).toBe('Declined');
  });

  it('keeps the fulfillment path for open confirmed orders', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'confirmed',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      confirmedByName: 'Surat Silk House',
      confirmedByRole: 'seller',
    });
    expect(steps.map((s) => s.key)).toEqual([
      'requested',
      'confirmed',
      'dispatched',
      'delivered',
    ]);
    expect(steps[1]?.label).toBe('Confirmed by Surat Silk House');
  });

  it('labels buyer quote accept without Confirm wording', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'confirmed',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      confirmedByName: 'you',
      confirmedByRole: 'buyer',
    });
    expect(steps[1]?.label).toBe('Quote accepted by you');
    expect(steps[1]?.label).not.toMatch(/confirm/i);
  });
});
