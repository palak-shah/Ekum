import { describe, expect, it } from 'vitest';
import {
  amendTrailChange,
  amendTrailSummary,
  collapseQuotedTrailEvents,
  isBareQuotedTrailSummary,
  isBareUpdatedTrailSummary,
  isDesignCountTrailDetail,
  isQtyEchoUpdatedTrailSummary,
  quoteTrailSummary,
  type OrderTrailEventView,
} from '@ekum/domain-types';

function step(
  partial: Pick<OrderTrailEventView, 'id' | 'type' | 'summary'> &
    Partial<OrderTrailEventView>,
): OrderTrailEventView {
  return {
    at: '2026-09-18T00:00:00.000Z',
    who: null,
    detail: null,
    note: null,
    noteVoiceUrl: null,
    noteVoiceDurationMs: null,
    ...partial,
  };
}

describe('amendTrailSummary', () => {
  it('names qty vs remove — no metres (Total already has them)', () => {
    expect(
      amendTrailSummary(amendTrailChange([{ productId: 'a', quantity: 10 }], [{ productId: 'a', quantity: 12 }])),
    ).toBe('Updated qty');
    expect(
      amendTrailSummary(
        amendTrailChange(
          [
            { productId: 'a', quantity: 10 },
            { productId: 'b', quantity: 10 },
          ],
          [{ productId: 'a', quantity: 10 }],
        ),
      ),
    ).toBe('Removed 1 design');
    expect(
      amendTrailSummary(
        amendTrailChange(
          [
            { productId: 'a', quantity: 10 },
            { productId: 'b', quantity: 10 },
            { productId: 'c', quantity: 10 },
          ],
          [{ productId: 'a', quantity: 12 }],
        ),
      ),
    ).toBe('Updated qty · Removed 2 designs');
    expect(amendTrailSummary({ qtyChanged: false, removedCount: 0, addedCount: 0 })).toBe(
      'Updated',
    );
  });

  it('treats null and plain Updated as bare; metres echo is not bare', () => {
    expect(isBareUpdatedTrailSummary(null)).toBe(true);
    expect(isBareUpdatedTrailSummary('Updated')).toBe(true);
    expect(isBareUpdatedTrailSummary('Updated qty')).toBe(false);
    expect(isQtyEchoUpdatedTrailSummary('Updated — 60 mtrs')).toBe(true);
    expect(isQtyEchoUpdatedTrailSummary('Updated qty')).toBe(false);
    expect(isDesignCountTrailDetail('6 designs')).toBe(true);
    expect(isDesignCountTrailDetail('1 design')).toBe(true);
    expect(isDesignCountTrailDetail('Updated qty')).toBe(false);
  });
});

describe('quoteTrailSummary', () => {
  it('labels the first quote with the total', () => {
    expect(quoteTrailSummary(275000, false)).toBe('Quoted — ₹2,75,000');
  });

  it('labels a later send as Quote updated', () => {
    expect(quoteTrailSummary(283800, true)).toBe('Quote updated — ₹2,83,800');
  });

  it('omits ₹ when total is null (blank pack size)', () => {
    expect(quoteTrailSummary(null, false)).toBe('Quoted');
    expect(quoteTrailSummary(null, true)).toBe('Quote updated');
  });

  it('treats null, plain Quoted, and plain Quote updated as bare', () => {
    expect(isBareQuotedTrailSummary(null)).toBe(true);
    expect(isBareQuotedTrailSummary('Quoted')).toBe(true);
    expect(isBareQuotedTrailSummary('Quote updated')).toBe(true);
    expect(isBareQuotedTrailSummary(quoteTrailSummary(null, true))).toBe(true);
    expect(isBareQuotedTrailSummary('Quoted — ₹2,75,000')).toBe(false);
    expect(isBareQuotedTrailSummary('Quote updated — ₹2,83,800')).toBe(false);
  });
});

describe('collapseQuotedTrailEvents', () => {
  it('keeps a single quote row as-is', () => {
    const trail = [
      step({ id: '1', type: 'requested', summary: 'Requested' }),
      step({ id: '2', type: 'quoted', summary: 'Quoted — ₹1,000' }),
    ];
    expect(collapseQuotedTrailEvents(trail)).toEqual({
      events: trail,
      quoteEditCount: 0,
    });
  });

  it('hides prior quotes and keeps only the latest', () => {
    const trail = [
      step({ id: '1', type: 'requested', summary: 'Requested' }),
      step({ id: '2', type: 'quoted', summary: 'Quoted — ₹1,000' }),
      step({ id: '3', type: 'quoted', summary: 'Quote updated — ₹1,200' }),
      step({ id: '4', type: 'confirmed', summary: 'Confirmed' }),
    ];
    const result = collapseQuotedTrailEvents(trail);
    expect(result.quoteEditCount).toBe(1);
    expect(result.events.map((e) => e.id)).toEqual(['1', '3', '4']);
    expect(result.events[1]?.summary).toBe('Quote updated — ₹1,200');
  });
});
