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

/** Update needs a name. Packs also need a design; General Collection does not. */
export function collectionEditUpdateDisabled(opts: {
  isGeneral?: boolean;
  name: string;
  memberCount: number;
}): boolean {
  if (!opts.name.trim()) return true;
  if (opts.isGeneral) return false;
  return opts.memberCount < 1;
}
