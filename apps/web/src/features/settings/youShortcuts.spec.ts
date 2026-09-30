import { describe, expect, it } from 'vitest';
import { settingsBusinessRoleLinks, youShortcutItems } from './youShortcuts';

describe('youShortcuts', () => {
  it('orders Home account rows: Profile through Settings', () => {
    expect(youShortcutItems().map((item) => item.label)).toEqual([
      'Profile',
      'Network',
      'My Collections',
      'My Designs',
      'Settings',
    ]);
    expect(youShortcutItems().find((item) => item.testId === 'my-designs')?.to).toBe(
      '/more?tab=products',
    );
  });

  it('puts Team and Your paths under Settings when trading', () => {
    expect(settingsBusinessRoleLinks(true).map((item) => item.to)).toEqual([
      '/team',
      '/settings/paths',
      '/settings/catalog-defaults',
      '/settings/units',
    ]);
    expect(settingsBusinessRoleLinks(false).map((item) => item.to)).toEqual(['/team']);
  });
});
