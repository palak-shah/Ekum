import { buildBulkPreview, parseBulkTagInput } from './bulk-tag-parse';

describe('parseBulkTagInput', () => {
  it('parses comma-separated values', () => {
    expect(parseBulkTagInput('Cotton, Polyester, PC Blend, Bamboo, Linen')).toEqual([
      'Cotton',
      'Polyester',
      'PC Blend',
      'Bamboo',
      'Linen',
    ]);
  });

  it('parses one value per line', () => {
    expect(parseBulkTagInput('Cotton\nPolyester\nBamboo')).toEqual([
      'Cotton',
      'Polyester',
      'Bamboo',
    ]);
  });

  it('parses tab-separated Excel clipboard', () => {
    expect(parseBulkTagInput('Cotton\tPolyester\tLinen')).toEqual([
      'Cotton',
      'Polyester',
      'Linen',
    ]);
  });

  it('trims whitespace and drops empties', () => {
    expect(parseBulkTagInput('  Cotton ,  , Polyester\n\n  ')).toEqual([
      'Cotton',
      'Polyester',
    ]);
  });

  it('preserves internal spaces and punctuation', () => {
    expect(parseBulkTagInput('Fitted / Flat Sheet, 28"-40"')).toEqual([
      'Fitted / Flat Sheet',
      '28"-40"',
    ]);
  });
});

describe('buildBulkPreview', () => {
  it('flags existing, paste duplicates, and new', () => {
    const rows = buildBulkPreview(
      ['Cotton', 'cotton', 'Silk', ''],
      new Set(['cotton']),
    );
    expect(rows.map((r) => r.status)).toEqual([
      'existing',
      'duplicate_in_paste',
      'new',
      'invalid',
    ]);
  });
});
