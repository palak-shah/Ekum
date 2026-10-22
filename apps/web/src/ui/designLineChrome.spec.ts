import { describe, expect, it } from 'vitest';
import {
  compactQtyInputClass,
  compactSheetNumInputClass,
  compactSheetRateInputClass,
  designNameClass,
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
    expect(stepperQtyInputClass).toContain('text-[14px]');
    expect(stepperQtyInputClass).not.toContain('text-base');
    expect(stepperBtnClass).toContain('h-7');
    expect(stepperBtnClass).toContain('text-[14px]');
    expect(stepperBtnClass).not.toContain('border-line');
  });

  it('name and subtext match catalog cards / chat titles', () => {
    expect(designNameClass).toContain('text-[15px]');
    expect(designNameClass).toContain('font-emphasis');
    expect(designSubtextClass).toContain('text-[12px]');
    expect(designSubtextClass).toContain('text-muted');
  });

  it('quote / confirm Qty | Rate match How many / Edit number type', () => {
    expect(compactSheetNumInputClass).toContain('text-[14px]');
    expect(compactSheetNumInputClass).toContain('font-emphasis');
    expect(compactSheetNumInputClass).toContain(FIELD_IDLE_FILL_CLASS);
    expect(compactSheetNumInputClass).not.toContain('text-base');
    expect(compactSheetRateInputClass).toContain('text-[14px]');
    expect(compactSheetRateInputClass).toContain('font-emphasis');
    expect(compactSheetRateInputClass).toContain(FIELD_IDLE_FILL_CLASS);
    expect(stepperQtyInputClass).toContain('text-[14px]');
    expect(stepperQtyInputClass).toContain('font-emphasis');
  });
});
