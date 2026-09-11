import { describe, expect, it } from 'vitest';
import {
  createProductIdentity,
  detailsCardTitle,
  generateDraftSku,
  gridHeading,
  overridesFromSheet,
  uniqueDraftSku,
  continuousCameraMaxShots,
} from './designBatchHelpers';

describe('generateDraftSku', () => {
  it('matches Edit design EK- plus 8 hex', () => {
    expect(generateDraftSku()).toMatch(/^EK-[0-9A-F]{8}$/);
  });
});

describe('uniqueDraftSku', () => {
  it('does not reuse a SKU already in the batch', () => {
    const taken = [generateDraftSku()];
    const next = uniqueDraftSku(taken);
    expect(next).toMatch(/^EK-[0-9A-F]{8}$/);
    expect(next).not.toBe(taken[0]);
  });

  it('skips a colliding generated code', () => {
    let n = 0;
    const next = uniqueDraftSku(['EK-AAAAAAAA'], () => {
      n += 1;
      return n === 1 ? 'EK-AAAAAAAA' : 'EK-BBBBBBBB';
    });
    expect(next).toBe('EK-BBBBBBBB');
  });
});

describe('createProductIdentity', () => {
  it('sends the same value as name and sku', () => {
    expect(createProductIdentity('  EK-ABCD1234  ')).toEqual({
      name: 'EK-ABCD1234',
      sku: 'EK-ABCD1234',
    });
  });
});

describe('gridHeading', () => {
  it('counts designs not photos', () => {
    expect(gridHeading(1)).toBe('1 design');
    expect(gridHeading(3)).toBe('3 designs');
  });
});

describe('detailsCardTitle', () => {
  it('hides same-for-all when there is only one design', () => {
    expect(detailsCardTitle(1)).toBe('This design');
    expect(detailsCardTitle(2)).toBe('Same for all designs');
  });
});

describe('overridesFromSheet', () => {
  const shared = {
    category: 'Sarees',
    rate: '1200',
    unit: 'piece',
    moq: '100',
    notes: '',
  };

  it('stores only fields that differ from shared', () => {
    expect(
      overridesFromSheet({ ...shared, rate: '900', notes: 'silk' }, shared),
    ).toEqual({ rate: '900', notes: 'silk' });
  });

  it('clears overrides when the sheet matches shared', () => {
    expect(overridesFromSheet(shared, shared)).toEqual({});
  });
});

describe('continuousCameraMaxShots', () => {
  it('uses remaining photo slots when appending to one design', () => {
    expect(
      continuousCameraMaxShots({
        appendToDraft: true,
        draftImageCount: 1,
        draftCount: 3,
        maxDesigns: 120,
        maxPhotosPerDesign: 12,
      }),
    ).toBe(11);
  });

  it('uses remaining design slots when capturing new designs', () => {
    expect(
      continuousCameraMaxShots({
        appendToDraft: false,
        draftImageCount: 0,
        draftCount: 3,
        maxDesigns: 120,
        maxPhotosPerDesign: 12,
      }),
    ).toBe(117);
  });
});
