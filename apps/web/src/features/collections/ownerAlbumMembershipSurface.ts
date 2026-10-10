/**
 * Owner Add existing / Add photos / Replace membership always runs on the album
 * viewer — never by hopping to Edit collection details.
 */
export function ownerAlbumMembershipSurface(): 'album-viewer' {
  return 'album-viewer';
}
