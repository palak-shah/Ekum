import { recomputeBulkPreview } from './adminTagKinds';

describe('recomputeBulkPreview', () => {
  it('marks empty and overlong labels invalid', () => {
    const preview = recomputeBulkPreview(
      [
        { index: 0, label: '  ' },
        { index: 1, label: 'x'.repeat(81) },
        { index: 2, label: 'Silk Soft' },
      ],
      new Set(),
    );
    expect(preview.rows.map((r) => r.status)).toEqual([
      'invalid',
      'invalid',
      'new',
    ]);
    expect(preview.summary).toEqual({
      new: 1,
      existing: 0,
      duplicateInPaste: 0,
      invalid: 2,
    });
  });

  it('reclassifies paste duplicates and existing after edit', () => {
    const preview = recomputeBulkPreview(
      [
        { index: 0, label: 'Cotton' },
        { index: 1, label: 'cotton' },
        { index: 2, label: 'Linen' },
      ],
      new Set(['cotton']),
    );
    expect(preview.rows.map((r) => r.status)).toEqual([
      'existing',
      'duplicate_in_paste',
      'new',
    ]);
  });
});
