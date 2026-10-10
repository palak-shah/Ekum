import { describe, expect, it } from 'vitest';
import { collectionEditShowsMemberGrid } from './collectionEditDetailsOnly';

describe('collectionEditShowsMemberGrid', () => {
  it('hides member grid on edit; keeps it on create', () => {
    expect(collectionEditShowsMemberGrid(true)).toBe(false);
    expect(collectionEditShowsMemberGrid(false)).toBe(true);
  });
});
