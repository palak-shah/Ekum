import { describe, expect, it } from 'vitest';
import {
  catalogRateDisplayUnit,
  catalogRateFieldLabel,
  createCatalogRateUnit,
  defaultRateUnit,
  formatCatalogRate,
  isPackOrderUnit,
} from './catalogRate';

describe('catalogRate', () => {
  it('treats set/dozen/box/bundle as pack order units', () => {
    expect(isPackOrderUnit('set')).toBe(true);
    expect(isPackOrderUnit('pc')).toBe(false);
    expect(isPackOrderUnit('mtr')).toBe(false);
  });

  it('shows pack rates per pc when dispatch matches order set (platform usual)', () => {
    expect(catalogRateDisplayUnit({ unit: 'set', dispatchUnit: 'set' })).toBe('pc');
    expect(catalogRateDisplayUnit({ unit: 'set', dispatchUnit: 'pc' })).toBe('pc');
    expect(catalogRateDisplayUnit({ unit: 'set', dispatchUnit: null })).toBe('pc');
    expect(
      catalogRateDisplayUnit({
        unit: 'set',
        dispatchUnit: null,
        offeredRateUnits: ['mtr', 'than'],
      }),
    ).toBe('mtr');
    expect(catalogRateDisplayUnit({ unit: 'set', dispatchUnit: 'mtr' })).toBe('mtr');
    expect(catalogRateDisplayUnit({ unit: 'pc' })).toBe('pc');
    expect(formatCatalogRate({ rate: 640, unit: 'set', dispatchUnit: 'set' })).toBe('₹640/pc');
    expect(formatCatalogRate({ rate: 640, unit: 'set', dispatchUnit: 'pc' })).toBe('₹640/pc');
    expect(formatCatalogRate({ rate: 94, unit: 'set', dispatchUnit: 'mtr' })).toBe('₹94/mtr');
    expect(
      formatCatalogRate({
        rate: 91,
        unit: 'set',
        dispatchUnit: 'set',
        catalogRateUnit: 'mtr',
      }),
    ).toBe('₹91/mtr');
    expect(formatCatalogRate({ rate: 91, unit: 'mtr' })).toBe('₹91/mtr');
    expect(formatCatalogRate({ rate: 640, unit: 'pc' })).toBe('₹640/pc');
    expect(formatCatalogRate({ rate: 800, unit: 'mtr' })).toBe('₹800/mtr');
  });

  it('labels create rate field per dispatch when pack', () => {
    expect(catalogRateFieldLabel('set', 'pc')).toBe('Rate per pc');
    expect(catalogRateFieldLabel('set', 'mtr')).toBe('Rate per mtr');
    expect(catalogRateFieldLabel('set', 'set', undefined, 'mtr')).toBe('Rate per mtr');
    expect(catalogRateFieldLabel('pc')).toBe('Rate');
  });

  it('defaults Rate per to the first offered unit (category primary), not prefer-pc', () => {
    expect(defaultRateUnit(['pc', 'dozen', 'set'])).toBe('pc');
    expect(defaultRateUnit(['mtr', 'kg'])).toBe('mtr');
    expect(defaultRateUnit(['mtr', 'kg', 'pc'])).toBe('mtr');
    expect(defaultRateUnit([])).toBe('pc');
    expect(
      catalogRateDisplayUnit({
        unit: 'set',
        dispatchUnit: 'set',
        offeredRateUnits: ['mtr', 'kg', 'pc'],
      }),
    ).toBe('mtr');
  });

  it('snaps create Rate per to primary until they pick another', () => {
    expect(
      createCatalogRateUnit({
        isCreate: true,
        permitted: ['mtr', 'kg', 'pc'],
        current: 'pc',
        userTouched: false,
      }),
    ).toBe('mtr');
    expect(
      createCatalogRateUnit({
        isCreate: true,
        permitted: ['pc', 'dozen', 'set'],
        current: 'pc',
        userTouched: false,
      }),
    ).toBeNull();
    expect(
      createCatalogRateUnit({
        isCreate: true,
        permitted: ['mtr', 'kg', 'pc'],
        current: 'kg',
        userTouched: true,
      }),
    ).toBeNull();
    expect(
      createCatalogRateUnit({
        isCreate: false,
        permitted: ['mtr', 'kg', 'pc'],
        current: 'pc',
        userTouched: false,
      }),
    ).toBeNull();
  });
});
