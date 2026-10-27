import { describe, expect, it } from 'vitest';
import {
  decideLinesConfirmExtras,
  decideLinesConfirmReady,
  decideLinesPayload,
  decideLinesTally,
  defaultLineActions,
  qtysWithSharedValue,
  resolveDecideConfirmQty,
} from './decideLinesSheet';

describe('decideLinesSheet', () => {
  const ids = ['a', 'b', 'c'];

  it('starts every line confirmed', () => {
    expect(defaultLineActions(ids)).toEqual({ a: 'confirm', b: 'confirm', c: 'confirm' });
  });

  it('Confirm writes tick as confirm with qty/rate and off as decline', () => {
    expect(
      decideLinesPayload(
        ids,
        { a: 'confirm', b: 'decline', c: 'confirm' },
        'confirm',
        { a: '8', c: '3' },
        { a: 10, b: 10, c: 5 },
        { a: '100', c: '50' },
        (raw) => {
          const n = Number(raw);
          return Number.isFinite(n) && n > 0 ? n : null;
        },
      ),
    ).toEqual([
      { orderItemId: 'a', action: 'confirm', quantity: 8, rate: 100 },
      { orderItemId: 'b', action: 'decline' },
      { orderItemId: 'c', action: 'confirm', quantity: 3, rate: 50 },
    ]);
  });

  it('Decline writes every open line as decline', () => {
    expect(
      decideLinesPayload(ids, { a: 'confirm', b: 'confirm', c: 'confirm' }, 'decline'),
    ).toEqual([
      { orderItemId: 'a', action: 'decline' },
      { orderItemId: 'b', action: 'decline' },
      { orderItemId: 'c', action: 'decline' },
    ]);
  });

  it('tallies confirm vs decline', () => {
    expect(decideLinesTally(ids, { a: 'confirm', b: 'decline', c: 'confirm' })).toEqual({
      confirm: 2,
      decline: 1,
    });
  });

  it('resolveDecideConfirmQty allows above line qty and falls back', () => {
    expect(resolveDecideConfirmQty('4', 10)).toBe(4);
    expect(resolveDecideConfirmQty('99', 10)).toBe(99);
    expect(resolveDecideConfirmQty('', 7)).toBe(7);
    expect(resolveDecideConfirmQty('abc', 7)).toBe(7);
  });

  it('omits rate on confirm when the box is blank', () => {
    expect(
      decideLinesPayload(
        ['a'],
        { a: 'confirm' },
        'confirm',
        { a: '50' },
        { a: 12 },
        { a: '' },
        () => null,
      ),
    ).toEqual([{ orderItemId: 'a', action: 'confirm', quantity: 50 }]);
  });

  it('Confirm is ready with qty even when rate is blank', () => {
    expect(
      decideLinesConfirmReady(['a', 'b'], { a: 'confirm', b: 'confirm' }, { a: '50', b: '' }, {
        a: 12,
        b: 12,
      }),
    ).toBe(true);
    expect(
      decideLinesConfirmReady(['a'], { a: 'decline' }, { a: '50' }, { a: 12 }),
    ).toBe(false);
    expect(
      decideLinesConfirmReady(['a'], { a: 'confirm' }, { a: '0' }, { a: 12 }),
    ).toBe(false);
  });

  it('Confirm extras include manual number, photos, and personal note', () => {
    expect(
      decideLinesConfirmExtras('confirm', {
        manualOrderNo: ' PO-19 ',
        manualImages: ['https://host/po.jpg'],
        personalNote: 'pack later',
        personalVoiceMediaId: 'media-1',
        personalVoiceDurationMs: 1200,
        personalImages: [],
      }),
    ).toEqual({
      manualOrderNo: 'PO-19',
      manualNoteImageUrls: ['https://host/po.jpg'],
      personalNote: 'pack later',
      personalNoteVoiceMediaId: 'media-1',
      personalNoteVoiceDurationMs: 1200,
      personalNoteImageUrls: [],
    });
  });

  it('omits Confirm extras on Decline all', () => {
    expect(
      decideLinesConfirmExtras('decline', {
        manualOrderNo: 'PO-19',
        manualImages: [],
        personalNote: 'no',
        personalImages: [],
      }),
    ).toEqual({});
  });

  it('qtysWithSharedValue fills or restores defaults', () => {
    expect(qtysWithSharedValue(['a', 'b'], '20', { a: '5', b: '8' })).toEqual({
      a: '20',
      b: '20',
    });
    expect(qtysWithSharedValue(['a', 'b'], '', { a: '5', b: '8' })).toEqual({
      a: '5',
      b: '8',
    });
  });
});
