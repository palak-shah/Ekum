import { describe, expect, it } from 'vitest';
import { FORM_CONTROL_WIDTH_CLASS, SHELL_X_CONTAIN_CLASS } from './mobileOverflow';

describe('mobileOverflow (BM-07)', () => {
  it('shell contains horizontal overflow', () => {
    expect(SHELL_X_CONTAIN_CLASS).toContain('overflow-x-hidden');
    expect(SHELL_X_CONTAIN_CLASS).toContain('min-w-0');
  });

  it('form controls are width-bounded for WebKit', () => {
    expect(FORM_CONTROL_WIDTH_CLASS).toContain('w-full');
    expect(FORM_CONTROL_WIDTH_CLASS).toContain('min-w-0');
    expect(FORM_CONTROL_WIDTH_CLASS).toContain('max-w-full');
  });
});
