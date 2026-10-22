/**
 * Published edit is pack details only — membership lives on the album.
 * Create and unpublished drafts keep Add designs / photos on the editor
 * (Save in Draft stays here; the album hides unpublished members).
 */
export function collectionEditShowsMemberGrid(opts: {
  editing: boolean;
  unpublished?: boolean;
}): boolean {
  if (!opts.editing) return true;
  return Boolean(opts.unpublished);
}
