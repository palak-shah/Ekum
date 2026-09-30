/** Own Business profile is a look-first page; `edit=1` or Explore `focus=sell` is the edit job. */
export function isOwnProfileEditing(pathname: string, search = ''): boolean {
  if (pathname !== '/settings/profile') return false;
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  return params.get('edit') === '1' || params.get('focus') === 'sell';
}
