import { describe, expect, it } from 'vitest';
import {
  catalogShareToastLabel,
  catalogShareRecipientIds,
  dedupeCompanyIds,
  shouldOpenChatAfterCatalogShare,
} from './catalogShareTargets';

describe('catalogShareRecipientIds', () => {
  const groups = [
    { id: 'g1', memberCompanyIds: ['x', 'y'] },
    { id: 'g2', memberCompanyIds: ['x', 'z'] },
  ];

  it('unions companies and groups once', () => {
    expect(
      catalogShareRecipientIds({
        selectedCompanyIds: ['y'],
        selectedGroupIds: ['g1', 'g2'],
        groups,
        eligibleCompanyIds: ['x', 'y', 'z'],
      }),
    ).toEqual(['y', 'x', 'z']);
  });

  it('drops stale group members not in connections', () => {
    expect(
      catalogShareRecipientIds({
        selectedCompanyIds: [],
        selectedGroupIds: ['g1'],
        groups,
        eligibleCompanyIds: ['y'],
      }),
    ).toEqual(['y']);
  });

  it('keeps Find-on-Ekum companies even if not in connections', () => {
    expect(
      catalogShareRecipientIds({
        selectedCompanyIds: ['new'],
        selectedGroupIds: ['g1'],
        groups,
        eligibleCompanyIds: ['x'],
      }),
    ).toEqual(['new', 'x']);
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
