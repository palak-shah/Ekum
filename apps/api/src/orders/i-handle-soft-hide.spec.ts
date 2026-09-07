import { describe, expect, it } from 'vitest';
import {
  buyerSafePassThroughSummary,
  scrubForeignPartyOrderBody,
  scrubUpstreamNames,
  textLeaksUpstreamName,
} from './i-handle-soft-hide';

describe('i-handle soft-hide', () => {
  const mills = ['Ahmedabad Loom Co', 'Jaipur Weaves'];

  it('detects mill name in trail summary', () => {
    expect(textLeaksUpstreamName('Ahmedabad Loom Co confirmed', mills)).toBe(true);
    expect(textLeaksUpstreamName('Surat Silk House confirmed', mills)).toBe(false);
  });

  it('scrubs mill name to trader-safe fallback', () => {
    expect(
      scrubUpstreamNames('Ahmedabad Loom Co confirmed', mills, 'Surat Silk House confirmed'),
    ).toBe('Surat Silk House confirmed');
    expect(
      scrubUpstreamNames('Ahmedabad Loom Co dispatched', mills, 'Surat Silk House dispatched'),
    ).toBe('Surat Silk House dispatched');
  });

  it('leaves trader copy alone', () => {
    expect(
      scrubUpstreamNames('Surat Silk House confirmed', mills, 'Surat Silk House confirmed'),
    ).toBe('Surat Silk House confirmed');
  });

  it('builds buyer-safe pass-through summaries with trader name only', () => {
    expect(buyerSafePassThroughSummary('confirmed', 'Surat Silk House')).toBe(
      'Surat Silk House confirmed',
    );
    expect(buyerSafePassThroughSummary('dispatched', 'Surat Silk House')).toBe(
      'Surat Silk House dispatched',
    );
    expect(buyerSafePassThroughSummary('part_shipped', 'Surat Silk House')).toBe(
      'Surat Silk House dispatched part',
    );
  });

  it('rewrites chat body that names a third shop', () => {
    expect(
      scrubForeignPartyOrderBody(
        'Ahmedabad Loom Co confirmed',
        'Meena Textiles',
        'Surat Silk House',
      ),
    ).toBe('Surat Silk House confirmed');
    expect(
      scrubForeignPartyOrderBody(
        'Surat Silk House confirmed',
        'Meena Textiles',
        'Surat Silk House',
      ),
    ).toBe('Surat Silk House confirmed');
  });
});
