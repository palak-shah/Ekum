import { describe, expect, it } from 'vitest';
import {
  catalogRateDisplayUnit,
  catalogRateFieldLabel,
  formatCatalogRate,
  isPackOrderUnit,
} from './catalogRate';

describe('catalogRate', () => {
  it('treats set/dozen/box/bundle as pack order units', () => {
    expect(isPackOrderUnit('set')).toBe(true);
    expect(isPackOrderUnit('pc')).toBe(false);
    expect(isPackOrderUnit('mtr')).toBe(false);
  });

  it('shows pack rates per dispatch (default pc)', () => {
    expect(catalogRateDisplayUnit({ unit: 'set', dispatchUnit: 'pc' })).toBe('pc');
    expect(catalogRateDisplayUnit({ unit: 'set', dispatchUnit: null })).toBe('pc');
    expect(catalogRateDisplayUnit({ unit: 'pc' })).toBe('pc');
    expect(formatCatalogRate({ rate: 640, unit: 'set', dispatchUnit: 'pc' })).toBe('₹640/pc');
    expect(formatCatalogRate({ rate: 640, unit: 'pc' })).toBe('₹640/pc');
    expect(formatCatalogRate({ rate: 800, unit: 'mtr' })).toBe('₹800/mtr');
  });

  it('labels create rate field per dispatch when pack', () => {
    expect(catalogRateFieldLabel('set', 'pc')).toBe('Rate per pc');
    expect(catalogRateFieldLabel('set', 'mtr')).toBe('Rate per mtr');
    expect(catalogRateFieldLabel('pc')).toBe('Rate');
  });
});
