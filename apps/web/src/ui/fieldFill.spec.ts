import { describe, expect, it } from 'vitest';
import {
  COMPOSER_SHELL_CLASS,
  FIELD_FOCUS_FILL_CLASS,
  FIELD_IDLE_AND_FOCUS_FILL_CLASS,
  FIELD_IDLE_FILL_CLASS,
  SELECT_FIELD_CLASS,
  THREAD_COMPOSER_CONTROL_CLASS,
  THREAD_COMPOSER_SHELL_CLASS,
} from '@/ui/fieldFill';
import { compactSheetNumInputClass, stepperTrackClass } from '@/ui/designLineChrome';
import { textInputChromeClass } from '@/ui/mobileOverflow';

describe('field fill (app-wide)', () => {
  it('one idle class is bg-input so --ekum-input restyles every field', () => {
    expect(FIELD_IDLE_FILL_CLASS).toBe('bg-input');
    expect(FIELD_FOCUS_FILL_CLASS).toBe('focus:bg-surface');
    expect(FIELD_IDLE_AND_FOCUS_FILL_CLASS).toContain(FIELD_IDLE_FILL_CLASS);
    expect(SELECT_FIELD_CLASS).toContain(FIELD_IDLE_FILL_CLASS);
    expect(COMPOSER_SHELL_CLASS).toContain(FIELD_IDLE_FILL_CLASS);
    expect(COMPOSER_SHELL_CLASS).toMatch(/rounded-2xl/);
    expect(COMPOSER_SHELL_CLASS).not.toMatch(/rounded-full/);
    expect(THREAD_COMPOSER_SHELL_CLASS).toMatch(/bg-surface/);
    expect(THREAD_COMPOSER_SHELL_CLASS).not.toMatch(/bg-input/);
    expect(THREAD_COMPOSER_SHELL_CLASS).toMatch(/rounded-full/);
    expect(THREAD_COMPOSER_SHELL_CLASS).toMatch(/overflow-visible/);
    expect(THREAD_COMPOSER_CONTROL_CLASS).toMatch(/h-9 w-9/);
    expect(THREAD_COMPOSER_CONTROL_CLASS).not.toMatch(/h-12/);
    expect(stepperTrackClass).toContain(FIELD_IDLE_FILL_CLASS);
    expect(stepperTrackClass).not.toContain('bg-foam');
    expect(compactSheetNumInputClass).toContain(FIELD_IDLE_FILL_CLASS);
    expect(compactSheetNumInputClass).not.toContain('bg-foam');
    expect(textInputChromeClass()).toContain(FIELD_IDLE_FILL_CLASS);
  });
});
