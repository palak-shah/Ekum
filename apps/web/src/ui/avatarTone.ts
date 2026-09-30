/** Pale wash + matching ink — current WhatsApp initials, not loud mid-tone discs. */
export type AvatarTone = { bg: string; ink: string };

export const AVATAR_TONES: readonly AvatarTone[] = [
  { bg: '#FDE8EC', ink: '#C45B6A' },
  { bg: '#E8F5E4', ink: '#5A8F4E' },
  { bg: '#FFF6E0', ink: '#B08A3A' },
  { bg: '#E8F3FC', ink: '#5B8FB8' },
  { bg: '#F0EBFB', ink: '#7A6BA8' },
  { bg: '#FCE8F2', ink: '#B86B8A' },
  { bg: '#E5F5F5', ink: '#4A8A8C' },
  { bg: '#FDEDE6', ink: '#C46A4A' },
];

export function avatarTone(name: string): AvatarTone {
  const key = name.trim() || '?';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_TONES.length;
  return AVATAR_TONES[index]!;
}
