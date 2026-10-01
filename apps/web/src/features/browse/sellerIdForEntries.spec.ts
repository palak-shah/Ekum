import { describe, expect, it } from 'vitest';
import { sellerIdForEntries } from './useShortlistOrderFlow';

describe('sellerIdForEntries', () => {
  it('is that shop when every line is one company', () => {
    expect(
      sellerIdForEntries([
        { companyId: 'surat' },
        { companyId: 'surat' },
      ]),
    ).toBe('surat');
  });

  it('is multi when shops differ so How many can split by settings', () => {
    expect(
      sellerIdForEntries([{ companyId: 'surat' }, { companyId: 'jaipur' }]),
    ).toBe('multi');
  });
});
