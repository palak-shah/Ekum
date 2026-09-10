import { describe, expect, it } from 'vitest';
import {
  COMPACT_QTY_INPUT_CLASS,
  FORM_CONTROL_WIDTH_CLASS,
  SHELL_X_CONTAIN_CLASS,
  formControlWidthClass,
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
});
