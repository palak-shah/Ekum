import { describe, expect, it } from 'vitest';
import {
  effectivePathFromLane,
  isReleasedMillSubset,
  laneBehaviorsFromJson,
  laneRoutesDirect,
  manageParentOpenChatThreadId,
  qtyChangeSummary,
  shouldRouteToTrio,
  trioMillLaneWhere,
} from './trade-lane';

describe('TradeLane reveal routing', () => {
  it('routes to trio only when reveal On and mill released', () => {
    expect(shouldRouteToTrio({ reveal: true, millReleased: true })).toBe(true);
    expect(shouldRouteToTrio({ reveal: true, millReleased: false })).toBe(false);
    expect(shouldRouteToTrio({ reveal: false, millReleased: true })).toBe(false);
  });

  it('treats only released mill hops as subset cards for the trio', () => {
    expect(
      isReleasedMillSubset({
        downstreamOrderId: 'main-1',
        upstreamReleasedAt: new Date(),
      }),
    ).toBe(true);
    expect(
      isReleasedMillSubset({
        downstreamOrderId: null,
        upstreamReleasedAt: null,
      }),
    ).toBe(false);
    expect(
      shouldRouteToTrio({
        reveal: true,
        millReleased: isReleasedMillSubset({
          downstreamOrderId: null,
          upstreamReleasedAt: null,
        }),
      }),
    ).toBe(false);
  });

  it('keeps parent Open chat on buyer↔trader 1:1 even when a mill trio exists (BM-08)', () => {
    expect(manageParentOpenChatThreadId('direct-bt', 'trio-mill-a')).toBe('direct-bt');
    expect(manageParentOpenChatThreadId('direct-bt', null)).toBe('direct-bt');
    expect(manageParentOpenChatThreadId(null, 'trio-mill-a')).toBeNull();
  });
});

describe('TradeLane place path', () => {
  it('defaults missing lane to handle (Me)', () => {
    expect(effectivePathFromLane(null)).toBe('handle');
    expect(effectivePathFromLane(undefined)).toBe('handle');
    expect(effectivePathFromLane('me')).toBe('handle');
  });

  it('maps mill ticket to direct', () => {
    expect(effectivePathFromLane('mill')).toBe('direct');
  });

  it('finds a mill lane for this buyer with mill and trader either way', () => {
    expect(trioMillLaneWhere('al', 'je', 'ss')).toEqual({
      ticket: 'mill',
      buyerCompanyId: 'ss',
      OR: [
        { traderCompanyId: 'al', sellerCompanyId: 'je' },
        { traderCompanyId: 'je', sellerCompanyId: 'al' },
      ],
    });
  });

  it('treats missing behaviors as Direct-order on and auto-repost off', () => {
    expect(laneBehaviorsFromJson(null)).toEqual({ directOrder: true, autoRepost: false });
    expect(laneBehaviorsFromJson({ directOrder: false })).toEqual({
      directOrder: false,
      autoRepost: false,
    });
    expect(laneBehaviorsFromJson({ autoRepost: true })).toEqual({
      directOrder: true,
      autoRepost: false,
    });
    expect(laneRoutesDirect({ ticket: 'mill' })).toBe(true);
    expect(laneRoutesDirect({ ticket: 'me' })).toBe(false);
    expect(laneRoutesDirect({ ticket: 'mill', behaviors: { directOrder: false } })).toBe(
      false,
    );
  });

  it('names qty before → after', () => {
    expect(qtyChangeSummary(20, 12)).toBe('Updated qty · 20 → 12');
  });
});
