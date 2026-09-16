import { describe, expect, it } from 'vitest';
import { designSetPath, parseDesignSetIds } from './designSetPath';

describe('designSetPath', () => {
  it('builds a designs set URL from product ids', () => {
    expect(designSetPath(['p1', 'p2'])).toBe('/designs/set?ids=p1%2Cp2');
  });

  it('dedupes and caps ids', () => {
    expect(parseDesignSetIds('p1,p1, p2')).toEqual(['p1', 'p2']);
  });

  it('adds facilitator when present', () => {
    expect(designSetPath(['a', 'b'], { facilitator: 'co-x' })).toContain('facilitator=co-x');
  });
});
