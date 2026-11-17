import { describe, expect, it } from 'vitest';
import {
  settingsBusinessRoleLinks,
  settingsPrivacyLinks,
  youShortcutItems,
} from './youShortcuts';

describe('youShortcuts', () => {
  it('orders Home account rows: Edit profile through Settings (Designs is a You tab)', () => {
    expect(youShortcutItems().map((item) => item.label)).toEqual([
      'Edit profile',
      'Network',
      'My Collections',
      'Settings',
    ]);
    expect(youShortcutItems().find((item) => item.testId === 'my-designs')).toBeUndefined();
    expect(youShortcutItems().find((item) => item.testId === 'profile')?.to).toBe(
      '/settings/profile?edit=1',
    );
  });

  it('puts Team under Settings; Direct links live on Network', () => {
    expect(settingsBusinessRoleLinks(true).map((item) => item.to)).toEqual([
      '/team',
      '/settings/catalog-defaults',
      '/settings/units',
    ]);
    expect(settingsBusinessRoleLinks(false).map((item) => item.to)).toEqual(['/team']);
  });

  it('Privacy domain has Profile visibility only', () => {
    expect(settingsPrivacyLinks()).toEqual([
      {
        to: '/settings/profile-visibility',
        title: 'Profile visibility',
        hint: 'Public or Private Business Profile',
      },
    ]);
  });
});
