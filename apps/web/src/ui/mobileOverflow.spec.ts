import { describe, expect, it } from 'vitest';
import {
  COMPACT_QTY_INPUT_CLASS,
  COMPACT_SHEET_NUM_INPUT_CLASS,
  FORM_CONTROL_WIDTH_CLASS,
  SHELL_X_CONTAIN_CLASS,
  formControlWidthClass,
  textInputChromeClass,
} from './mobileOverflow';

describe('mobileOverflow (BM-07)', () => {
  it('shell contains horizontal overflow', () => {
    expect(SHELL_X_CONTAIN_CLASS).toContain('overflow-x-hidden');
    expect(SHELL_X_CONTAIN_CLASS).toContain('min-w-0');
  });

  it('form controls are width-bounded for WebKit', () => {
    expect(FORM_CONTROL_WIDTH_CLASS).toContain('min-w-0');
    expect(FORM_CONTROL_WIDTH_CLASS).toContain('max-w-full');
    expect(formControlWidthClass()).toContain('w-full');
  });

  it('does not force w-full over a compact qty width (BM-07 dispatch names)', () => {
    const compact = formControlWidthClass(COMPACT_QTY_INPUT_CLASS);
    expect(compact).not.toMatch(/(?:^|\s)w-full(?:\s|$)/);
    expect(COMPACT_QTY_INPUT_CLASS).toContain('w-20');
  });

  it('skips default pad/min-h/text when compact sheet nums set them (Send quote clip)', () => {
    const chrome = textInputChromeClass(COMPACT_SHEET_NUM_INPUT_CLASS);
    expect(chrome).not.toContain('px-3.5');
    expect(chrome).not.toContain('min-h-12');
    expect(chrome).not.toMatch(/(?:^|\s)text-base(?:\s|$)/);
    expect(COMPACT_SHEET_NUM_INPUT_CLASS).toContain('px-1.5');
    expect(COMPACT_SHEET_NUM_INPUT_CLASS).toContain('appearance-none');
  });

  it('keeps full kit chrome when no compact overrides', () => {
    const chrome = textInputChromeClass();
    expect(chrome).toContain('px-3.5');
    expect(chrome).toContain('min-h-12');
    expect(chrome).toContain('text-base');
  });
});
