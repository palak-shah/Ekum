import { describe, expect, it } from 'vitest';
import {
  catalogShareToastLabel,
  dedupeCompanyIds,
  shouldOpenChatAfterCatalogShare,
} from './catalogShareTargets';

describe('dedupeCompanyIds', () => {
  it('dedupes and drops blanks', () => {
    expect(dedupeCompanyIds(['a', 'b', 'a', '', '  ', 'b'])).toEqual(['a', 'b']);
  });
});

describe('shouldOpenChatAfterCatalogShare', () => {
  it('opens only for a single recipient', () => {
    expect(shouldOpenChatAfterCatalogShare(1)).toBe(true);
    expect(shouldOpenChatAfterCatalogShare(2)).toBe(false);
    expect(shouldOpenChatAfterCatalogShare(0)).toBe(false);
  });
});

describe('catalogShareToastLabel', () => {
  it('names one recipient and counts many', () => {
    expect(catalogShareToastLabel({ recipientCount: 1, singleName: 'Jaipur Emporium' })).toBe(
      'Shared with Jaipur Emporium',
    );
    expect(catalogShareToastLabel({ recipientCount: 3 })).toBe('Shared with 3');
  });
});
