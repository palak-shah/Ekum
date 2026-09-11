import { describe, expect, it } from 'vitest';
import {
  absolutizeMediaUrl,
  absolutizeProductImageFields,
  originFromPublicMediaBase,
} from './absolutize-media-url';

describe('absolutizeMediaUrl', () => {
  const beta = 'https://beta.ekum.app';

  it('turns relative /media paths into absolute URLs for Save to my designs', () => {
    expect(absolutizeMediaUrl('/media/seed/lining.jpg', beta)).toBe(
      'https://beta.ekum.app/media/seed/lining.jpg',
    );
  });

  it('rewrites localhost seed thumbs onto the public origin', () => {
    expect(
      absolutizeMediaUrl('http://127.0.0.1:3000/media/seed/lining.jpg', beta),
    ).toBe('https://beta.ekum.app/media/seed/lining.jpg');
  });

  it('leaves Azure blob URLs alone', () => {
    const azure = 'https://acct.blob.core.windows.net/media/c1/a.jpg';
    expect(absolutizeMediaUrl(azure, beta)).toBe(azure);
  });
});

describe('absolutizeProductImageFields', () => {
  it('rewrites images on create/update bodies before Zod url()', () => {
    expect(
      absolutizeProductImageFields(
        { name: 'Soft Lining Roll', images: ['/media/seed/lining.jpg'] },
        'https://beta.ekum.app/media',
      ),
    ).toEqual({
      name: 'Soft Lining Roll',
      images: ['https://beta.ekum.app/media/seed/lining.jpg'],
    });
  });

  it('derives origin from PUBLIC_MEDIA_BASE_URL', () => {
    expect(originFromPublicMediaBase('https://beta.ekum.app/media/')).toBe(
      'https://beta.ekum.app',
    );
  });
});
