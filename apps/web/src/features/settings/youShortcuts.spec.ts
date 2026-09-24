import { describe, expect, it } from 'vitest';
import { settingsBusinessRoleLinks, youShortcutItems } from './youShortcuts';

describe('youShortcuts', () => {
  it('keeps Saved, Network, and Settings on You', () => {
    expect(youShortcutItems().map((item) => item.label)).toEqual(['Network', 'Settings']);
  });

  it('puts Team and Your paths under Settings when trading', () => {
    expect(settingsBusinessRoleLinks(true).map((item) => item.to)).toEqual([
      '/team',
      '/settings/paths',
    ]);
    expect(settingsBusinessRoleLinks(false).map((item) => item.to)).toEqual(['/team']);
  });
});
