import { describe, expect, it } from 'vitest';
import { partyCompanyHref } from './partyCompanyHref';

describe('partyCompanyHref', () => {
  it('leaves your shop unlinked', () => {
    expect(partyCompanyHref(true, 'seed-company-ravi')).toBeNull();
  });

  it('opens the other shop profile', () => {
    expect(partyCompanyHref(false, 'seed-company-jaipur')).toBe('/company/seed-company-jaipur');
  });

  it('skips a missing shop id', () => {
    expect(partyCompanyHref(false, '')).toBeNull();
    expect(partyCompanyHref(false, undefined)).toBeNull();
  });
});
