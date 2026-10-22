import { describe, expect, it } from 'vitest';
import { collectionEditShowsMemberGrid } from './collectionEditDetailsOnly';

describe('collectionEditShowsMemberGrid', () => {
  it('hides member grid on published edit; keeps it on create and draft', () => {
    expect(collectionEditShowsMemberGrid({ editing: true })).toBe(false);
    expect(collectionEditShowsMemberGrid({ editing: true, unpublished: true })).toBe(true);
    expect(collectionEditShowsMemberGrid({ editing: false })).toBe(true);
  });
});
