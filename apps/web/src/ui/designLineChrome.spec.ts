import { describe, expect, it } from 'vitest';
import {
  compactQtyInputClass,
  compactSheetNumInputClass,
  compactSheetRateInputClass,
  designNameClass,
  designQtyClass,
  designRateClass,
  designSubtextClass,
  sheetDesignNameClass,
  sheetFieldLabelClass,
  sheetLineCueClass,
  sheetNumInputClass,
  sheetRateInputClass,
  sheetStepperBtnClass,
  sheetStepperQtyInputClass,
  sheetStepperTrackClass,
  sheetTextAreaClass,
  sheetTextInputClass,
  SHEET_COMPOSER_SHELL_CLASS,
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
    expect(designNameClass).toContain('font-title');
    expect(designNameClass).not.toContain('font-emphasis');
    expect(designSubtextClass).toContain('text-meta');
    expect(designSubtextClass).toContain('text-muted');
  });

  it('ticket + Confirm/Dispatch name match proto .dl b / .hd b (14px)', () => {
    expect(sheetDesignNameClass).toContain('text-[14px]');
    expect(sheetDesignNameClass).toContain('font-title');
    expect(designNameClass).toContain('text-name');
    expect(sheetLineCueClass).toContain('text-[12.5px]');
    expect(sheetLineCueClass).toContain('text-muted');
    expect(sheetLineCueClass).not.toContain('text-meta');
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

  it('order-sheet editors are bordered surface (no bg-input)', () => {
    expect(sheetStepperTrackClass).toContain('h-10');
    expect(sheetStepperTrackClass).toContain('border-line');
    expect(sheetStepperTrackClass).toContain('bg-surface');
    expect(sheetStepperTrackClass).toContain('justify-between');
    expect(sheetStepperTrackClass).not.toContain(FIELD_IDLE_FILL_CLASS);
    expect(sheetStepperTrackClass).not.toContain('rounded-full');
    expect(sheetStepperQtyInputClass).toContain('flex-1');
    expect(sheetStepperQtyInputClass).not.toContain('w-8');
    expect(sheetNumInputClass).toContain('bg-surface');
    expect(sheetNumInputClass).toContain('border-line');
    expect(sheetNumInputClass).not.toContain(FIELD_IDLE_FILL_CLASS);
    expect(sheetRateInputClass).toContain('bg-surface');
    expect(sheetRateInputClass).toContain('text-left');
    expect(sheetRateInputClass).toContain('px-2.5');
    expect(sheetRateInputClass).not.toContain('text-center');
    expect(sheetRateInputClass).not.toContain(FIELD_IDLE_FILL_CLASS);
    expect(sheetStepperBtnClass).toContain('h-[34px]');
    expect(sheetStepperBtnClass).toContain('w-[34px]');
    expect(sheetTextInputClass).toContain('bg-surface');
    expect(sheetTextAreaClass).toContain('bg-surface');
    expect(sheetTextAreaClass).toContain('border-line');
    expect(sheetTextAreaClass).not.toContain('h-10');
    expect(sheetTextAreaClass).not.toContain(FIELD_IDLE_FILL_CLASS);
    expect(sheetFieldLabelClass).toContain('text-[11.5px]');
    expect(sheetFieldLabelClass).not.toContain('uppercase');
    expect(sheetFieldLabelClass).not.toContain('text-center');
    expect(SHEET_COMPOSER_SHELL_CLASS).toContain('bg-surface');
    expect(SHEET_COMPOSER_SHELL_CLASS).not.toContain(FIELD_IDLE_FILL_CLASS);
  });
});
