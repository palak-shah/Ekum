import { describe, expect, it } from 'vitest';
import { CollectionStatus } from '@ekum/domain-types';
import {
  assertValidLiveWindow,
  isCollectionLiveForBuyers,
  parseScheduleInstant,
} from './collection-schedule';

describe('collection-schedule', () => {
  it('parses date-only start and end to UTC bounds', () => {
    const start = parseScheduleInstant('2026-09-12', 'start');
    const end = parseScheduleInstant('2026-09-20', 'end');
    expect(start?.toISOString()).toBe('2026-09-12T00:00:00.000Z');
    expect(end?.toISOString()).toBe('2026-09-20T23:59:59.999Z');
  });

  it('treats null as clear and undefined as omit', () => {
    expect(parseScheduleInstant(null, 'start')).toBeNull();
    expect(parseScheduleInstant(undefined, 'end')).toBeUndefined();
  });

  it('rejects inverted windows', () => {
    expect(() =>
      assertValidLiveWindow(new Date('2026-09-20'), new Date('2026-09-12')),
    ).toThrow(/before end/i);
  });

  it('gates buyer live visibility by status and window', () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    expect(
      isCollectionLiveForBuyers(
        { status: CollectionStatus.Published, startsAt: null, endsAt: null },
        now,
      ),
    ).toBe(true);
    expect(
      isCollectionLiveForBuyers(
        {
          status: CollectionStatus.Published,
          startsAt: '2026-09-20T00:00:00.000Z',
          endsAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isCollectionLiveForBuyers(
        {
          status: CollectionStatus.Ready,
          startsAt: null,
          endsAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isCollectionLiveForBuyers(
        {
          status: CollectionStatus.Published,
          startsAt: null,
          endsAt: '2026-09-10T23:59:59.999Z',
        },
        now,
      ),
    ).toBe(false);
  });
});
