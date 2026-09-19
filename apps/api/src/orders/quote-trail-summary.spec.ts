import { describe, expect, it } from 'vitest';
import {
  collapseQuotedTrailEvents,
  isBareQuotedTrailSummary,
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

describe('quoteTrailSummary', () => {
  it('labels the first quote with the total', () => {
    expect(quoteTrailSummary(275000, false)).toBe('Quoted — ₹2,75,000');
  });

  it('labels a later send as Quote updated', () => {
    expect(quoteTrailSummary(283800, true)).toBe('Quote updated — ₹2,83,800');
  });

  it('treats null and plain Quoted as bare (legacy trail)', () => {
    expect(isBareQuotedTrailSummary(null)).toBe(true);
    expect(isBareQuotedTrailSummary('Quoted')).toBe(true);
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
