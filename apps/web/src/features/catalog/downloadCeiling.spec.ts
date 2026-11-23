import { describe, expect, it } from 'vitest';
import { maxAllowDownloadForCuratedPack } from './downloadCeiling';

describe('maxAllowDownloadForCuratedPack', () => {
  it('allows when own-only', () => {
    expect(
      maxAllowDownloadForCuratedPack('me', [{ companyId: 'me', allowDownload: false }]),
    ).toBe(true);
  });

  it('blocks when any foreign member has download off', () => {
    expect(
      maxAllowDownloadForCuratedPack('me', [
        { companyId: 'mill', allowDownload: false },
        { companyId: 'mill-2', allowDownload: true },
      ]),
    ).toBe(false);
  });

  it('allows when every foreign member allows', () => {
    expect(
      maxAllowDownloadForCuratedPack('me', [{ companyId: 'mill', allowDownload: true }]),
    ).toBe(true);
  });

  it('blocks when source pack forbids', () => {
    expect(
      maxAllowDownloadForCuratedPack(
        'me',
        [{ companyId: 'mill', allowDownload: true }],
        false,
      ),
    ).toBe(false);
  });
});
