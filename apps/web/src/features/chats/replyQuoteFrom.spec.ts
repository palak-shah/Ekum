import { describe, expect, it } from 'vitest';
import { replyQuoteFromLabel } from './replyQuoteFrom';

describe('replyQuoteFromLabel', () => {
  it('says You when quoting our shop', () => {
    expect(
      replyQuoteFromLabel({
        senderCompanyId: 'me',
        viewerCompanyId: 'me',
        shopName: 'Jaipur Emporium',
      }),
    ).toBe('You');
  });

  it('names the other shop', () => {
    expect(
      replyQuoteFromLabel({
        senderCompanyId: 'them',
        viewerCompanyId: 'me',
        shopName: 'Surat Silk House',
      }),
    ).toBe('Surat Silk House');
  });

  it('falls back when the original is gone', () => {
    expect(replyQuoteFromLabel({})).toBe('Message');
  });
});
