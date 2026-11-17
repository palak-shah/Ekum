export function youShortcutItems(): { to: string; label: string; testId: string }[] {
  return [
    { to: '/settings/profile?edit=1', label: 'Edit profile', testId: 'profile' },
    { to: '/network', label: 'Network', testId: 'network' },
    { to: '/more?tab=collections', label: 'My Collections', testId: 'my-collections' },
    { to: '/settings', label: 'Settings', testId: 'settings' },
  ];
}

export type SettingsDomainLink = {
  to: string;
  title: string;
  hint: string;
};

/** Navigable rows under Business & Roles. Add here — do not add a one-off Settings page. */
export function settingsBusinessRoleLinks(
  trading: boolean,
  selling = false,
): SettingsDomainLink[] {
  return [
    { to: '/team', title: 'Team', hint: 'People on this shop' },
    ...(selling || trading
      ? [
          {
            to: '/settings/catalog-defaults',
            title: 'Catalog defaults',
            hint: 'Usual Who · sell-as for new collections',
          },
          {
            to: '/settings/units',
            title: 'Units',
            hint: 'Receive vs deliver conversions',
          },
        ]
      : []),
  ];
}

/** Privacy domain — only real rows (no empty shell). */
export function settingsPrivacyLinks(): SettingsDomainLink[] {
  return [
    {
      to: '/settings/profile-visibility',
      title: 'Profile visibility',
      hint: 'Public or Private Business Profile',
    },
  ];
}

