/** Caption on the create-album strip after designs or photos exist. */
export function createAlbumChangeLabel(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${n} ${n === 1 ? 'design' : 'designs'} · tap to change`;
}

export const CREATE_ALBUM_STRIP_MAX = 6;
