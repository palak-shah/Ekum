import { describe, expect, it } from 'vitest';
import { designSheetShortlistEntry } from './designSheetEntry';

describe('designSheetShortlistEntry', () => {
  it('stamps collection id and name for How many headings', () => {
    const entry = designSheetShortlistEntry(
      {
        id: 'p1',
        name: 'Navy',
        images: [],
        companyId: 'c1',
        companyName: 'Surat',
        allowForward: true,
        categories: [],
        unit: 'set',
        dispatchUnit: 'pc',
        piecesPerPack: 4,
        moq: null,
        rate: null,
        rateMax: null,
      },
      'Surat',
      {
        collectionId: 'col-1',
        collectionName: 'Wedding',
        handlerName: 'Trader',
        handlerCompanyId: 't1',
        path: 'handle',
        allowForward: true,
      },
    );
    expect(entry.sourceCollectionId).toBe('col-1');
    expect(entry.sourceCollectionName).toBe('Wedding');
  });
});
