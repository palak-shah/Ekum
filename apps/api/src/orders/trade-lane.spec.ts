import { describe, expect, it } from 'vitest';
import {
  effectivePathFromLane,
  isReleasedMillSubset,
  manageParentOpenChatThreadId,
  shouldRouteToTrio,
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
});
