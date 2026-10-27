import { describe, expect, it } from 'vitest';
import {
  collectionEditShowsMemberGrid,
  collectionEditUpdateDisabled,
} from './collectionEditDetailsOnly';

describe('collectionEditShowsMemberGrid', () => {
  it('hides member grid on published edit; keeps it on create and draft', () => {
    expect(collectionEditShowsMemberGrid({ editing: true })).toBe(false);
    expect(collectionEditShowsMemberGrid({ editing: true, unpublished: true })).toBe(true);
    expect(collectionEditShowsMemberGrid({ editing: false })).toBe(true);
  });
});

describe('collectionEditUpdateDisabled', () => {
  it('lets General Collection save name and description with no designs', () => {
    expect(
      collectionEditUpdateDisabled({ isGeneral: true, name: 'Shop leftovers', memberCount: 0 }),
    ).toBe(false);
    expect(collectionEditUpdateDisabled({ isGeneral: true, name: '  ', memberCount: 0 })).toBe(
      true,
    );
  });

  it('still needs a design on a real pack', () => {
    expect(collectionEditUpdateDisabled({ name: 'Wedding', memberCount: 0 })).toBe(true);
    expect(collectionEditUpdateDisabled({ name: 'Wedding', memberCount: 1 })).toBe(false);
  });
});
