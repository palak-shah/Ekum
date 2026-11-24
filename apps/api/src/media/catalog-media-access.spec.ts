import { describe, expect, it } from 'vitest';
import {
  applyProductMediaAccess,
  catalogMediaAccess,
} from './catalog-media-access';

describe('catalogMediaAccess', () => {
  it('gives owners full access', () => {
    expect(
      catalogMediaAccess({
        viewerCompanyId: 'me',
        ownerCompanyId: 'me',
        allowDownload: false,
      }),
    ).toBe('full');
  });

  it('gives allowDownload visitors full access', () => {
    expect(
      catalogMediaAccess({
        viewerCompanyId: 'buyer',
        ownerCompanyId: 'mill',
        allowDownload: true,
      }),
    ).toBe('full');
  });

  it('locks other visitors to preview (Download gating only)', () => {
    expect(
      catalogMediaAccess({
        viewerCompanyId: 'buyer',
        ownerCompanyId: 'mill',
        allowDownload: false,
      }),
    ).toBe('preview');
  });
});

describe('applyProductMediaAccess', () => {
  it('keeps plain original URLs for locked visitors', () => {
    const original = 'http://localhost:3000/media/mill/original/a.jpg';
    const out = applyProductMediaAccess(
      {
        companyId: 'mill',
        allowDownload: false,
        images: [original],
      },
      'buyer',
    );
    expect(out.images[0]).toBe(original);
    expect(out.images[0]).not.toContain('ekum_sig=');
  });

  it('strips legacy signed query params from stored product images', () => {
    const out = applyProductMediaAccess(
      {
        companyId: 'mill',
        allowDownload: false,
        images: [
          'http://localhost:3000/media/mill/original/a.jpg?ekum_k=full&ekum_exp=9&ekum_sig=abc',
        ],
      },
      'buyer',
    );
    expect(out.images[0]).toBe('http://localhost:3000/media/mill/original/a.jpg');
  });
});
