import { describe, expect, it } from 'vitest';
import { toAbsoluteMediaUrl } from './mediaUrl';

describe('toAbsoluteMediaUrl', () => {
  it('turns relative /media paths into absolute page URLs', () => {
    expect(toAbsoluteMediaUrl('/media/c1/a.jpg', 'https://beta.ekum.app')).toBe(
      'https://beta.ekum.app/media/c1/a.jpg',
    );
  });

  it('rewrites localhost media hosts to the page origin', () => {
    expect(
      toAbsoluteMediaUrl('http://localhost:8080/media/c1/a.jpg', 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/c1/a.jpg');
  });

  it('rewrites LAN http media on an https page (mixed content)', () => {
    expect(
      toAbsoluteMediaUrl(
        'http://74.225.252.243:8081/media/seed-company-ravi/x.jpg',
        'https://beta.ekum.app',
      ),
    ).toBe('https://beta.ekum.app/media/seed-company-ravi/x.jpg');
  });

  it('leaves already-correct absolute URLs alone', () => {
    expect(
      toAbsoluteMediaUrl('https://beta.ekum.app/media/c1/a.jpg', 'https://beta.ekum.app'),
    ).toBe('https://beta.ekum.app/media/c1/a.jpg');
  });

  it('leaves Azure blob URLs alone', () => {
    const azure =
      'https://acct.blob.core.windows.net/media/c1/a.jpg';
    expect(toAbsoluteMediaUrl(azure, 'https://beta.ekum.app')).toBe(azure);
  });
});
