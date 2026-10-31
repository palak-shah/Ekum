import { describe, expect, it } from 'vitest';
import { newestFirstTrail, timelineUpdatedDot, timelineVisibleSlice } from './orderTimelineDisplay';

describe('newestFirstTrail', () => {
  it('reverses oldest-first trail', () => {
    expect(newestFirstTrail([{ id: 'a' }, { id: 'b' }, { id: 'c' }]).map((e) => e.id)).toEqual([
      'c',
      'b',
      'a',
    ]);
  });

  it('leaves empty and single alone', () => {
    expect(newestFirstTrail([])).toEqual([]);
    expect(newestFirstTrail([{ id: 'a' }])).toEqual([{ id: 'a' }]);
  });
});

describe('timelineVisibleSlice', () => {
  it('shows only newest when collapsed', () => {
    const rows = [{ id: 'c' }, { id: 'b' }, { id: 'a' }];
    expect(timelineVisibleSlice(rows, false)).toEqual({
      visible: [{ id: 'c' }],
      hiddenCount: 2,
    });
  });

  it('shows all when expanded', () => {
    const rows = [{ id: 'c' }, { id: 'b' }];
    expect(timelineVisibleSlice(rows, true).visible).toEqual(rows);
    expect(timelineVisibleSlice(rows, true).hiddenCount).toBe(0);
  });
});

describe('timelineUpdatedDot', () => {
  it('marks Updated / amend rows', () => {
    expect(timelineUpdatedDot('updated', 'Updated qty')).toBe(true);
    expect(timelineUpdatedDot('quoted', 'Quoted — ₹1,200')).toBe(false);
    expect(timelineUpdatedDot(undefined, 'Updated qty')).toBe(true);
  });
});
