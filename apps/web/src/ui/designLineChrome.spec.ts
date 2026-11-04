import { describe, expect, it } from 'vitest';
import {
  compactQtyInputClass,
  compactSheetNumInputClass,
  compactSheetRateInputClass,
  designNameClass,
  designQtyClass,
  designRateClass,
  designSubtextClass,
  stepperBtnClass,
  stepperQtyInputClass,
  stepperTrackClass,
} from '@/ui/designLineChrome';
import { COMPACT_QTY_INPUT_CLASS } from '@/ui/mobileOverflow';
import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';

describe('designLineChrome', () => {
  it('This LR box stays one string; − n + is a field-fill pill with no border', () => {
    expect(COMPACT_QTY_INPUT_CLASS).toBe(compactQtyInputClass);
    expect(compactQtyInputClass).toContain('min-h-8');
    expect(compactQtyInputClass).toContain('text-base');
    expect(stepperTrackClass).toContain(FIELD_IDLE_FILL_CLASS);
    expect(stepperTrackClass).not.toContain('bg-foam');
    expect(stepperTrackClass).toContain('rounded-full');
    expect(stepperTrackClass).not.toContain('border');
    expect(stepperQtyInputClass).toContain('border-0');
    expect(stepperQtyInputClass).toContain('bg-transparent');
    expect(stepperQtyInputClass).toContain('text-base');
    expect(stepperBtnClass).toContain('h-7');
    expect(stepperBtnClass).toContain('text-base');
    expect(stepperBtnClass).not.toContain('border-line');
  });

  it('name and subtext match catalog cards / chat titles', () => {
    expect(designNameClass).toContain('text-name');
    expect(designNameClass).toContain('font-emphasis');
    expect(designSubtextClass).toContain('text-meta');
    expect(designSubtextClass).toContain('text-muted');
  });

  it('ticket qty and rate are muted meta (prototype ladder)', () => {
    expect(designQtyClass).toContain('text-meta');
    expect(designQtyClass).toContain('text-muted');
    expect(designQtyClass).toContain('tabular-nums');
    expect(designQtyClass).not.toContain('font-emphasis');
    expect(designRateClass).toContain('text-meta');
    expect(designRateClass).toContain('text-muted');
    expect(designRateClass).toContain('tabular-nums');
    expect(designRateClass).not.toContain('font-emphasis');
  });

  it('quote / confirm Qty | Rate match How many / Edit number type', () => {
    expect(compactSheetNumInputClass).toContain('text-base');
    expect(compactSheetNumInputClass).toContain('font-emphasis');
    expect(compactSheetNumInputClass).toContain(FIELD_IDLE_FILL_CLASS);
    expect(compactSheetRateInputClass).toContain('text-base');
    expect(compactSheetRateInputClass).toContain('font-emphasis');
    expect(compactSheetRateInputClass).toContain(FIELD_IDLE_FILL_CLASS);
    expect(stepperQtyInputClass).toContain('text-base');
    expect(stepperQtyInputClass).toContain('font-emphasis');
  });
});
