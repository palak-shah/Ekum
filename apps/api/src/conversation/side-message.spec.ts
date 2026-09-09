import { describe, expect, it } from 'vitest';
import { messageVisibleToCompany } from './side-message';

describe('messageVisibleToCompany', () => {
  it('hides denied collection view asks from the requester', () => {
    const message = {
      type: 'collection_card',
      metadata: {
        kind: 'collection_view_request',
        status: 'denied',
        requesterCompanyId: 'meena',
        targetCompanyId: 'kavita',
      },
    };
    expect(messageVisibleToCompany(message, 'meena')).toBe(false);
    expect(messageVisibleToCompany(message, 'kavita')).toBe(true);
  });

  it('hides denied relist asks from the requester', () => {
    const message = {
      type: 'product_card',
      metadata: {
        kind: 'relist_request',
        status: 'denied',
        requesterCompanyId: 'meena',
        targetCompanyId: 'kavita',
      },
    };
    expect(messageVisibleToCompany(message, 'meena')).toBe(false);
    expect(messageVisibleToCompany(message, 'kavita')).toBe(true);
  });

  it('keeps pending asks visible to both', () => {
    const message = {
      type: 'collection_card',
      metadata: {
        kind: 'collection_view_request',
        status: 'pending',
        requesterCompanyId: 'meena',
        targetCompanyId: 'kavita',
      },
    };
    expect(messageVisibleToCompany(message, 'meena')).toBe(true);
    expect(messageVisibleToCompany(message, 'kavita')).toBe(true);
  });
});
