import { describe, expect, it } from 'vitest';
import {
  albumFactsRateBand,
  albumTileShopLine,
  collectionRateBand,
  designCardShopLine,
  packHeaderSubtitle,
  packHeaderSubtitleWithShop,
  packRateBand,
} from './packHeaderSubtitle';

describe('packHeaderSubtitle', () => {
  it('keeps count only — rate band is under categories', () => {
    expect(
      packHeaderSubtitle(9, [
        { rate: 280, rateMax: null, unit: 'mtr' },
        { rate: 300, rateMax: 445, unit: 'mtr' },
        { rate: 400, rateMax: null, unit: 'mtr' },
      ]),
    ).toBe('9 designs');
    expect(packHeaderSubtitle(1, [{ rate: null, rateMax: null, unit: 'mtr' }])).toBe('1 design');
  });

  it('builds a same-unit rate band for the facts block (sr 16 T3)', () => {
    expect(
      packRateBand([
        { rate: 280, rateMax: null, unit: 'mtr' },
        { rate: 300, rateMax: 445, unit: 'mtr' },
        { rate: 400, rateMax: null, unit: 'mtr' },
      ]),
    ).toBe('₹280–₹445 /mtr');
    expect(
      packRateBand([
        { rate: 280, unit: 'mtr' },
        { rate: 10, unit: 'pc' },
      ]),
    ).toBeNull();
    expect(
      packRateBand([{ rate: 640, rateMax: null, unit: 'set', dispatchUnit: 'pc' }]),
    ).toBe('₹640 /pc');
  });

  it('formats pack rate only — never invents a band from members', () => {
    expect(
      collectionRateBand(
        { rate: 1500, rateMax: null },
        [
          { rate: 1200, rateMax: null, unit: 'pc' },
          { rate: 1200, rateMax: null, unit: 'pc' },
        ],
      ),
    ).toBe('₹1,500 /pc');
    expect(
      collectionRateBand(
        { rate: null, rateMax: null },
        [
          { rate: 800, rateMax: 1000, unit: 'pc' },
          { rate: 800, rateMax: 1000, unit: 'pc' },
        ],
      ),
    ).toBeNull();
  });

  it('album facts use rateMin only — omit when on request left rateMin null', () => {
    expect(
      albumFactsRateBand({
        rateMin: 500,
        rateMax: 700,
        rateUnit: 'pc',
      }),
    ).toBe('₹500–₹700 /pc');
    expect(
      albumFactsRateBand({
        rateMin: null,
        rateMax: null,
        rateUnit: null,
      }),
    ).toBeNull();
  });
});

describe('designCardShopLine', () => {
  it('always names the shop; From only for curated foreign', () => {
    expect(designCardShopLine('Surat Silk House')).toBe('Surat Silk House');
    expect(designCardShopLine('Jaipur Emporium', true)).toBe('From Jaipur Emporium');
    expect(designCardShopLine('  ')).toBeNull();
  });
});

describe('albumTileShopLine', () => {
  it('never shows mill / From under album design tiles', () => {
    expect(
      albumTileShopLine({
        mixedSources: false,
        creditMills: true,
        shopName: 'Ahmedabad Loom Co',
      }),
    ).toBeNull();
    expect(
      albumTileShopLine({
        mixedSources: true,
        creditMills: true,
        shopName: 'Surat Silk House',
        curatedFrom: true,
      }),
    ).toBeNull();
  });
});

describe('packHeaderSubtitleWithShop', () => {
  it('appends from {shop} for visitors without the rate band', () => {
    expect(
      packHeaderSubtitleWithShop(
        6,
        [{ rate: 85, rateMax: 160, unit: 'mtr' }],
        'Ahmedabad Loom Co',
      ),
    ).toBe('6 designs · from Ahmedabad Loom Co');
    expect(packHeaderSubtitleWithShop(2, [], '  ')).toBe('2 designs');
  });
});
