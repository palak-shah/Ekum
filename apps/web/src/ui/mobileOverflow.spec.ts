import { describe, expect, it } from 'vitest';
import {
  COMPACT_QTY_INPUT_CLASS,
  COMPACT_SHEET_NUM_INPUT_CLASS,
  COMPACT_SHEET_RATE_INPUT_CLASS,
  FORM_CONTROL_WIDTH_CLASS,
  SHELL_FRAME_CLASS,
  SHELL_MAIN_SCROLL_CLASS,
  PHOTO_STRIP_TOUCH_CLASS,
  SHELL_X_CONTAIN_CLASS,
  formControlWidthClass,
  textInputChromeClass,
} from './mobileOverflow';

describe('mobileOverflow (BM-07)', () => {
  it('shell contains horizontal overflow', () => {
    expect(SHELL_X_CONTAIN_CLASS).toContain('overflow-x-clip');
    expect(SHELL_X_CONTAIN_CLASS).not.toContain('overflow-x-hidden');
    expect(SHELL_X_CONTAIN_CLASS).toContain('min-w-0');
  });

  it('photo strip allows vertical feed scroll on iPhone (BM-07)', () => {
    expect(PHOTO_STRIP_TOUCH_CLASS).toContain('touch-[pan-x_pan-y]');
    expect(PHOTO_STRIP_TOUCH_CLASS).not.toMatch(/(?:^|\s)touch-pan-x(?:\s|$)/);
    expect(PHOTO_STRIP_TOUCH_CLASS).toContain('overscroll-x-contain');
  });

  it('phone frame locks viewport height; main owns the scrollport', () => {
    expect(SHELL_FRAME_CLASS).toContain('h-full');
    expect(SHELL_FRAME_CLASS).toContain('overflow-hidden');
    expect(SHELL_MAIN_SCROLL_CLASS).toContain('ekum-shell-scroll');
    expect(SHELL_MAIN_SCROLL_CLASS).toContain('overflow-y-auto');
    expect(SHELL_MAIN_SCROLL_CLASS).not.toContain('ekum-no-scrollbar');
  });

  it('form controls are width-bounded for WebKit', () => {
    expect(FORM_CONTROL_WIDTH_CLASS).toContain('min-w-0');
    expect(FORM_CONTROL_WIDTH_CLASS).toContain('max-w-full');
    expect(formControlWidthClass()).toContain('w-full');
  });

  it('does not force w-full over a compact qty width (BM-07 dispatch names)', () => {
    const compact = formControlWidthClass(COMPACT_QTY_INPUT_CLASS);
    expect(compact).not.toMatch(/(?:^|\s)w-full(?:\s|$)/);
    expect(COMPACT_QTY_INPUT_CLASS).toContain('w-12');
    expect(COMPACT_QTY_INPUT_CLASS).toContain('min-h-8');
    expect(COMPACT_QTY_INPUT_CLASS).toContain('text-base');
    expect(COMPACT_QTY_INPUT_CLASS).toContain('appearance-none');
  });

  it('skips default pad/min-h/text/border when quiet sheet nums set them', () => {
    const chrome = textInputChromeClass(COMPACT_SHEET_NUM_INPUT_CLASS);
    expect(chrome).not.toContain('px-3.5');
    expect(chrome).not.toContain('min-h-10');
    expect(chrome).not.toMatch(/(?:^|\s)text-base(?:\s|$)/);
    expect(chrome).not.toMatch(/(?:^|\s)font-body(?:\s|$)/);
    expect(chrome).not.toMatch(/(?:^|\s)border-line(?:\s|$)/);
    expect(chrome).not.toContain('rounded-xl');
    expect(COMPACT_SHEET_NUM_INPUT_CLASS).toContain('min-h-8');
    expect(COMPACT_SHEET_NUM_INPUT_CLASS).toContain('border-line/40');
    expect(COMPACT_SHEET_NUM_INPUT_CLASS).toContain('appearance-none');
    expect(COMPACT_SHEET_NUM_INPUT_CLASS).toContain('font-emphasis');
    expect(COMPACT_SHEET_NUM_INPUT_CLASS).toContain('text-[14px]');
  });

  it('keeps quiet rate soft chrome (not a tall kit box)', () => {
    const chrome = textInputChromeClass(COMPACT_SHEET_RATE_INPUT_CLASS);
    expect(chrome).not.toContain('px-3.5');
    expect(COMPACT_SHEET_RATE_INPUT_CLASS).toContain('min-h-8');
    expect(COMPACT_SHEET_RATE_INPUT_CLASS).toContain('border-line/40');
  });

  it('keeps full kit chrome when no compact overrides', () => {
    const chrome = textInputChromeClass();
    expect(chrome).toContain('px-3.5');
    expect(chrome).toContain('min-h-10');
    expect(chrome).toContain('text-base');
    expect(chrome).toContain('select-text');
    expect(chrome).toContain('font-body');
    expect(chrome).toContain('placeholder:not-italic');
    expect(chrome).toContain('placeholder:text-sm');
    expect(chrome).toContain('placeholder:text-muted');
    expect(chrome).not.toMatch(/(?:^|\s)placeholder:italic(?:\s|$)/);
    expect(chrome).not.toContain('placeholder:text-muted/50');
    expect(chrome).toContain('bg-input');
    expect(chrome).toContain('focus:bg-surface');
    expect(chrome).toContain('border-line');
    expect(chrome).toContain('focus:border-line');
    expect(chrome).not.toContain('focus:border-accent');
  });

  it('skips kit placeholder tokens when the field sets its own', () => {
    const chrome = textInputChromeClass('placeholder:text-xs placeholder:text-ink');
    expect(chrome).not.toContain('placeholder:not-italic');
    expect(chrome).not.toContain('placeholder:text-sm');
    expect(chrome).not.toContain('placeholder:text-muted');
  });

  it('locks disabled/read-only fields with foam fill (editable stay white)', () => {
    const locked = textInputChromeClass(undefined, { locked: true });
    expect(locked).toContain('bg-foam/90');
    expect(locked).toContain('text-muted');
    expect(locked).not.toContain('bg-input');
    expect(locked).not.toContain('focus:bg-surface');
  });
});
