/**
 * Edit collection is pack details only — membership chrome lives on the album.
 * Create still shows the designs grid + Add designs.
 */
export function collectionEditShowsMemberGrid(editing: boolean): boolean {
  return !editing;
}
