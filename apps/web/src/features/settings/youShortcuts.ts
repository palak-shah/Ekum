export function youShortcutItems(): { to: string; label: string }[] {
  return [
    { to: '/network', label: 'Network' },
    { to: '/settings', label: 'Settings' },
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
    ...(trading
      ? [
          {
            to: '/settings/paths',
            title: 'Your paths',
            hint: 'Who orders are with · see each other',
          },
        ]
      : []),
    ...(selling || trading
      ? [
          {
            to: '/settings/catalog-defaults',
            title: 'Catalog defaults',
            hint: 'Usual Who · sell-as for new packs',
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

