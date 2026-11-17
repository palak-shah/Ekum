import { describe, expect, it } from 'vitest';
import {
  UNDERLINE_TAB_BAR_BASE_CLASS,
  underlineTabChrome,
  youLibraryKindTabSelectedClass,
} from './underlineTabChrome';

describe('underlineTabChrome', () => {
  it('selected state matches Orders language (text-accent + h-1 bg-accent), not lime border-badge', () => {
    const on = underlineTabChrome(true);
    const off = underlineTabChrome(false);
    expect(on.buttonClass).toMatch(/text-accent/);
    expect(on.buttonClass).not.toMatch(/border-badge|text-chip-on-ink|bg-chip-on/);
    expect(on.barClass).toBe('bg-accent');
    expect(off.buttonClass).toMatch(/text-muted/);
    expect(off.barClass).toBe('bg-transparent');
    expect(UNDERLINE_TAB_BAR_BASE_CLASS).toMatch(/h-1/);
  });

  it('You/Home kind helper is sibling-parity with Orders chrome (same button classes)', () => {
    expect(youLibraryKindTabSelectedClass(true)).toBe(underlineTabChrome(true).buttonClass);
    expect(youLibraryKindTabSelectedClass(false)).toBe(underlineTabChrome(false).buttonClass);
  });
});
