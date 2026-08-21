import { describe, expect, it } from 'vitest';
import { nextIdSet, selectAllState } from './selectAllState';

describe('selectAllState', () => {
  it('is Select all when none of this list are selected', () => {
    expect(selectAllState(['a', 'b'], [])).toEqual({
      allSelected: false,
      action: 'select-all',
    });
  });

  it('is Select all when only some of this list are selected', () => {
    expect(selectAllState(['a', 'b'], ['a'])).toEqual({
      allSelected: false,
      action: 'select-all',
    });
  });

  it('is Clear when every visible id is selected', () => {
    expect(selectAllState(['a', 'b'], ['a', 'b', 'other'])).toEqual({
      allSelected: true,
      action: 'clear',
    });
  });

  it('is not all-selected on an empty list', () => {
    expect(selectAllState([], ['a'])).toEqual({
      allSelected: false,
      action: 'select-all',
    });
  });
});

describe('nextIdSet', () => {
  it('adds only visible ids on Select all', () => {
    expect([...nextIdSet(['a', 'b'], ['keep'])].sort()).toEqual(['a', 'b', 'keep']);
  });

  it('removes only visible ids on Clear', () => {
    expect([...nextIdSet(['a', 'b'], ['a', 'b', 'keep'])]).toEqual(['keep']);
  });
});
