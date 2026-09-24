export type FollowersInboxTab = 'asked' | 'following';

export function followersInboxTabFromSearch(
  search: string,
  askedCount: number,
): FollowersInboxTab {
  const tab = new URLSearchParams(search).get('tab');
  if (tab === 'asked') return 'asked';
  if (tab === 'following') return 'following';
  return askedCount > 0 ? 'asked' : 'following';
}

export function followAccessLabel(kind: string): string {
  return kind === 'pack' ? 'Put in a pack' : 'Look through';
}
