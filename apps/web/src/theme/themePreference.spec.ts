import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyResolvedTheme,
  EKUM_DEFAULT_THEME_PREFERENCE,
  readLastThemePreference,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
} from './themePreference';

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.style.colorScheme = '';
});

describe('themePreference', () => {
  it('defaults to system without userId or stored value', () => {
    expect(readThemePreference(null)).toBe(EKUM_DEFAULT_THEME_PREFERENCE);
    expect(readThemePreference('u1')).toBe('system');
  });

  it('stores preference per userId', () => {
    writeThemePreference('u1', 'dark');
    writeThemePreference('u2', 'light');
    expect(readThemePreference('u1')).toBe('dark');
    expect(readThemePreference('u2')).toBe('light');
    expect(readLastThemePreference()).toBe('light');
  });

  it('resolves system from prefersDark', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('applies dark/light class on html', () => {
    applyResolvedTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    applyResolvedTheme('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('ekum.theme.u1', 'neon');
    expect(readThemePreference('u1')).toBe('system');
  });

  it('survives localStorage throw', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => writeThemePreference('u1', 'dark')).not.toThrow();
    spy.mockRestore();
  });
});
