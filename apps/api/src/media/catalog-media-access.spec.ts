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

  it('locks other visitors to preview', () => {
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
  it('rewrites locked visitor images to signed thumbnail1', () => {
    const out = applyProductMediaAccess(
      {
        companyId: 'mill',
        allowDownload: false,
        images: ['http://localhost:3000/media/mill/original/a.jpg'],
      },
      'buyer',
    );
    expect(out.images[0]).toContain('/thumbnail1/');
    expect(out.images[0]).toContain('ekum_k=preview');
    expect(out.images[0]).toContain('ekum_sig=');
  });
});
