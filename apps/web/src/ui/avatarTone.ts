/** Mid tones with white initials — WhatsApp-like, not all one brand teal. */
export const AVATAR_TONES = [
  '#E17076',
  '#7BC862',
  '#E5A84B',
  '#65AADD',
  '#A695E7',
  '#EE7AAE',
  '#6EC9CB',
  '#F0785A',
] as const;

export function avatarTone(name: string): string {
  const key = name.trim() || '?';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_TONES.length;
  return AVATAR_TONES[index]!;
}
