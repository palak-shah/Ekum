import { describe, expect, it } from 'vitest';
import {
  CATEGORY_TAXONOMY,
  categoriesToTagSlots,
  itemSlotSuggestions,
  mainsForCompany,
  parentKeysFromCompanyCategories,
  qualitySlotSuggestions,
  sizeSlotSuggestions,
  SuperCategory,
  tagSlotsToCategories,
} from '@ekum/domain-types';

describe('tag cascade', () => {
  const womens = mainsForCompany(['WOMENS WEAR']);
  const mix = mainsForCompany(['WOMENS WEAR', 'ACCESSORIES']);

  it('item slot suggests Readymade when typing r', () => {
    expect(itemSlotSuggestions(womens, 'r')).toContain('Readymade');
  });

  it('quality after Readymade includes 3 Pcs Kurti', () => {
    expect(qualitySlotSuggestions(womens, 'Readymade', '')).toContain('3 Pcs Kurti');
  });

  it('custom item widens quality to both mains, not Readymade-only children', () => {
    const custom = qualitySlotSuggestions(mix, 'My own tag', '');
    expect(custom).toContain('Bags');
    expect(custom).not.toEqual(qualitySlotSuggestions(womens, 'Readymade', ''));
  });

  it('MM Top/Bottom/Dupatta sizes include S M L XL', () => {
    const sizes = sizeSlotSuggestions(womens, 'MM - Top/Bottom/Dupatta', '', '');
    expect(sizes).toEqual(expect.arrayContaining(['S', 'M', 'L', 'XL']));
  });

  it('maps deals-in supers to mains', () => {
    expect(
      parentKeysFromCompanyCategories([], [SuperCategory.WomensApparel, SuperCategory.Accessories]),
    ).toEqual(['WOMENS WEAR', 'ACCESSORIES']);
  });

  it('puts deal-in Accessories before sell Fabric so Bags is not buried', () => {
    const keys = parentKeysFromCompanyCategories(['Fabric'], [SuperCategory.Accessories]);
    expect(keys).toEqual(['ACCESSORIES', 'FABRICS']);
    const labels = itemSlotSuggestions(mainsForCompany(keys), '');
    expect(labels.slice(0, 10)).toEqual(
      expect.arrayContaining(['Ready Made', 'Rugs', 'Bags', 'Belts']),
    );
    expect(labels).toContain('Suiting Fabric');
  });

  it('round-trips official item, quality, and size into the right slots', () => {
    const slots = categoriesToTagSlots(['Readymade', 'Embroidered', 'S']);
    expect(slots.items).toContain('Readymade');
    expect(slots.qualities).toContain('Embroidered');
    expect(slots.size).toBe('S');
    expect(tagSlotsToCategories({ items: ['Readymade', 'Saree'], qualities: ['Embroidered', 'Printed'], size: 'M' })).toEqual(
      ['Readymade', 'Saree', 'Embroidered', 'Printed', 'M'],
    );
  });

  it('keeps custom labels on Item tags so search still has them', () => {
    const slots = categoriesToTagSlots(['My own tag', 'S']);
    expect(slots.items).toContain('My own tag');
    expect(slots.size).toBe('S');
  });

  it('covers six mains', () => {
    expect(CATEGORY_TAXONOMY.map((m) => m.key).sort()).toEqual(
      [
        'ACCESSORIES',
        'FABRICS',
        'HOME TEXTILES',
        'KIDS WEAR',
        'MENS WEAR',
        'WOMENS WEAR',
      ],
    );
  });
});
