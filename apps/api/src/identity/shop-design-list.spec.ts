import { describe, expect, it } from 'vitest';
import { shopPublishedDesignWhere } from './shop-design-list';

describe('shopPublishedDesignWhere', () => {
  it('includes pack members without an Explore post', () => {
    const where = shopPublishedDesignWhere('buyer', 'jaipur');
    expect(where.companyId).toBe('jaipur');
    expect(JSON.stringify(where)).toContain('collections');
    expect(JSON.stringify(where)).toContain('postedToMarketAt');
  });

  it('lets the owner skip the live window', () => {
    const buyer = JSON.stringify(shopPublishedDesignWhere('buyer', 'jaipur'));
    const owner = JSON.stringify(shopPublishedDesignWhere('jaipur', 'jaipur'));
    expect(buyer).toContain('startsAt');
    expect(owner).not.toContain('startsAt');
  });
});
