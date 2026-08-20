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

  it('inserts Quoted with offered/asked when seller quoted a lower qty', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'requested',
      hasSellerQuote: true,
      sellerName: 'Surat Silk House',
      items: [
        {
          quantity: 20,
          requestedQuantity: 25,
          lineStatus: 'open',
        },
      ],
    });
    expect(steps.map((s) => s.key)).toEqual([
      'requested',
      'quoted',
      'dispatched',
      'delivered',
    ]);
    expect(steps[0]).toMatchObject({ done: true, current: false });
    expect(steps[1]).toMatchObject({
      key: 'quoted',
      label: 'Quoted by Surat Silk House',
      detail: 'Offered 20 (asked 25)',
      done: true,
      current: true,
      at: '2026-08-11T02:00:00.000Z',
    });
  });

  it('omits Quoted when the seller has not quoted', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'requested',
      hasSellerQuote: false,
      items: [{ quantity: 10, requestedQuantity: 10, lineStatus: 'open' }],
    });
    expect(steps.map((s) => s.key)).toEqual(['requested', 'dispatched', 'delivered']);
    expect(steps[0]).toMatchObject({ current: true });
  });

  it('keeps Quoted before Confirmed after the buyer accepts', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'confirmed',
      hasSellerQuote: true,
      sellerName: 'Surat Silk House',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      confirmedByName: 'you',
      confirmedByRole: 'buyer',
      items: [
        { quantity: 20, requestedQuantity: 25, lineStatus: 'confirmed' },
        { quantity: 5, requestedQuantity: 10, lineStatus: 'confirmed' },
      ],
    });
    expect(steps.map((s) => s.key)).toEqual([
      'requested',
      'quoted',
      'confirmed',
      'dispatched',
      'delivered',
    ]);
    expect(steps[1]).toMatchObject({
      key: 'quoted',
      detail: 'Qty lowered on 2 designs',
      done: true,
      current: false,
    });
    expect(steps[2]?.label).toBe('Quote accepted by you');
  });

  it('appends Return requested after Delivered and marks it current', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'delivered',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      confirmedByName: 'Surat Silk House',
      confirmedByRole: 'seller',
      deliveredAt: '2026-08-12T10:00:00.000Z',
      dispatch: { dispatchedAt: '2026-08-12T08:00:00.000Z' },
      returns: [
        {
          id: 'ret-1',
          status: 'requested',
          createdAt: '2026-08-13T09:00:00.000Z',
        },
      ],
    });
    expect(steps.map((s) => s.key)).toEqual([
      'requested',
      'confirmed',
      'dispatched',
      'delivered',
      'return-ret-1-requested',
    ]);
    expect(steps.find((s) => s.key === 'delivered')).toMatchObject({
      done: true,
      current: false,
    });
    expect(steps.at(-1)).toMatchObject({
      label: 'Return requested',
      at: '2026-08-13T09:00:00.000Z',
      done: true,
      current: true,
    });
  });

  it('shows approved and resolved return steps with current on latest', () => {
    const steps = buildOrderTimelineSteps({
      ...base,
      status: 'delivered',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      confirmedByRole: 'seller',
      deliveredAt: '2026-08-12T10:00:00.000Z',
      dispatch: { dispatchedAt: '2026-08-12T08:00:00.000Z' },
      returns: [
        {
          id: 'ret-1',
          status: 'resolved',
          createdAt: '2026-08-13T09:00:00.000Z',
          decidedAt: '2026-08-13T11:00:00.000Z',
          resolvedAt: '2026-08-14T12:00:00.000Z',
        },
      ],
    });
    expect(steps.map((s) => s.key)).toEqual([
      'requested',
      'confirmed',
      'dispatched',
      'delivered',
      'return-ret-1-requested',
      'return-ret-1-decided',
      'return-ret-1-resolved',
    ]);
    expect(steps.find((s) => s.key === 'return-ret-1-decided')).toMatchObject({
      label: 'Return approved',
      at: '2026-08-13T11:00:00.000Z',
      current: false,
    });
    expect(steps.at(-1)).toMatchObject({
      label: 'Return resolved',
      at: '2026-08-14T12:00:00.000Z',
      done: true,
      current: true,
    });
  });

  it('labels partially approved and declined returns', () => {
    const partial = buildOrderTimelineSteps({
      ...base,
      status: 'delivered',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      deliveredAt: '2026-08-12T10:00:00.000Z',
      dispatch: { dispatchedAt: '2026-08-12T08:00:00.000Z' },
      returns: [
        {
          id: 'ret-p',
          status: 'partially_approved',
          createdAt: '2026-08-13T09:00:00.000Z',
          decidedAt: '2026-08-13T11:00:00.000Z',
        },
      ],
    });
    expect(partial.find((s) => s.key === 'return-ret-p-decided')).toMatchObject({
      label: 'Return partially approved',
      current: true,
    });

    const declined = buildOrderTimelineSteps({
      ...base,
      status: 'delivered',
      confirmedAt: '2026-08-11T01:30:00.000Z',
      deliveredAt: '2026-08-12T10:00:00.000Z',
      dispatch: { dispatchedAt: '2026-08-12T08:00:00.000Z' },
      returns: [
        {
          id: 'ret-d',
          status: 'declined',
          createdAt: '2026-08-13T09:00:00.000Z',
          decidedAt: '2026-08-13T11:00:00.000Z',
        },
      ],
    });
    expect(declined.find((s) => s.key === 'return-ret-d-decided')).toMatchObject({
      label: 'Return declined',
      current: true,
    });
  });
});
