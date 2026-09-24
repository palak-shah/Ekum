import { describe, expect, it } from 'vitest';
import { companyProfileShareBody, companyProfileShareUrl } from './CompanyShareSheet';

describe('company profile share copy', () => {
  it('builds the public shop URL', () => {
    expect(companyProfileShareUrl('https://app.ekum.test/', 'seed-company-ravi')).toBe(
      'https://app.ekum.test/company/seed-company-ravi',
    );
  });

  it('puts the shop URL in the chat body', () => {
    expect(
      companyProfileShareBody('Surat Silk House', 'https://app.ekum.test/company/ravi'),
    ).toBe('Surat Silk House on Ekum\nhttps://app.ekum.test/company/ravi');
  });
});
