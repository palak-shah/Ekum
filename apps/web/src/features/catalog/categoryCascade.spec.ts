import { describe, expect, it } from 'vitest';
import {
  CATEGORY_TAXONOMY,
  categoriesToTagSlots,
  itemSlotSuggestions,
  mainsForCompany,
  parentKeysFromCompanyCategories,
  pruneOfficialTagsOnCategoryChange,
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

  it('round-trips official item, quality, and sizes into the right slots', () => {
    const slots = categoriesToTagSlots(['Readymade', 'Embroidered', 'S', 'M']);
    expect(slots.items).toContain('Readymade');
    expect(slots.qualities).toContain('Embroidered');
    expect(slots.sizes).toEqual(['S', 'M']);
    expect(
      tagSlotsToCategories({
        items: ['Readymade', 'Saree'],
        qualities: ['Embroidered', 'Printed'],
        sizes: ['M', 'L'],
      }),
    ).toEqual(['Readymade', 'Saree', 'Embroidered', 'Printed', 'M', 'L']);
  });

  it('keeps custom labels on Item tags so search still has them', () => {
    const slots = categoriesToTagSlots(['My own tag', 'S']);
    expect(slots.items).toContain('My own tag');
    expect(slots.sizes).toEqual(['S']);
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

  it('on category change keeps custom tags and shared official; drops old-only official', () => {
    const pruned = pruneOfficialTagsOnCategoryChange(
      {
        items: ['Readymade', 'My own tag'],
        qualities: ['Embroidered', 'Shop special'],
        sizes: ['S', 'XXL'],
      },
      {
        itemTypes: ['Readymade', 'Saree'],
        qualities: ['Embroidered', 'Printed'],
        sizes: ['S', 'M', 'L'],
      },
      {
        itemTypes: ['Saree', 'Lehenga'],
        qualities: ['Printed', 'Plain'],
        sizes: ['M', 'L', 'XL'],
      },
    );
    expect(pruned.items).toEqual(['My own tag']);
    expect(pruned.qualities).toEqual(['Shop special']);
    expect(pruned.sizes).toEqual(['XXL']);
  });

  it('keeps official tags still offered by the new category', () => {
    const pruned = pruneOfficialTagsOnCategoryChange(
      {
        items: ['Readymade'],
        qualities: ['Printed'],
        sizes: ['M'],
      },
      {
        itemTypes: ['Readymade', 'Saree'],
        qualities: ['Embroidered', 'Printed'],
        sizes: ['S', 'M', 'L'],
      },
      {
        itemTypes: ['Readymade', 'Kurti'],
        qualities: ['Printed', 'Plain'],
        sizes: ['M', 'L'],
      },
    );
    expect(pruned).toEqual({
      items: ['Readymade'],
      qualities: ['Printed'],
      sizes: ['M'],
    });
  });

  it('treats all tags as custom when there was no prior category pool', () => {
    const pruned = pruneOfficialTagsOnCategoryChange(
      {
        items: ['Readymade', 'Custom'],
        qualities: ['Embroidered'],
        sizes: ['S'],
      },
      { itemTypes: [], qualities: [], sizes: [] },
      {
        itemTypes: ['Saree'],
        qualities: ['Printed'],
        sizes: ['M'],
      },
    );
    expect(pruned.items).toEqual(['Readymade', 'Custom']);
    expect(pruned.qualities).toEqual(['Embroidered']);
    expect(pruned.sizes).toEqual(['S']);
  });
});
