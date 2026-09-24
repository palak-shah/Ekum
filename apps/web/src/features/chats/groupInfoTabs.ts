export const GROUP_INFO_TABS = ['businesses', 'media', 'settings'] as const;
export type GroupInfoTab = (typeof GROUP_INFO_TABS)[number];

export const GROUP_INFO_TAB_LABEL: Record<GroupInfoTab, string> = {
  businesses: 'Businesses',
  media: 'Media',
  settings: 'Settings',
};

export const GROUP_MEDIA_KINDS = ['photos', 'documents', 'designs', 'collections'] as const;
export type GroupMediaKind = (typeof GROUP_MEDIA_KINDS)[number];

export const GROUP_MEDIA_LABEL: Record<GroupMediaKind, string> = {
  photos: 'Photos',
  documents: 'Documents',
  designs: 'Designs',
  collections: 'Collections',
};

export function parseGroupInfoTab(raw: string | null): GroupInfoTab {
  return raw && (GROUP_INFO_TABS as readonly string[]).includes(raw)
    ? (raw as GroupInfoTab)
    : 'businesses';
}

export function parseGroupMediaKind(raw: string | null): GroupMediaKind | null {
  if (!raw) return null;
  return (GROUP_MEDIA_KINDS as readonly string[]).includes(raw) ? (raw as GroupMediaKind) : null;
}
