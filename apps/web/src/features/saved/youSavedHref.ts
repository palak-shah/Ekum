/** Saved on You is the chip beside Archived, under Designs / Collections. */
export function youSavedHref(input?: { collections?: boolean; select?: boolean }): string {
  const query = new URLSearchParams();
  if (input?.collections) query.set('tab', 'collections');
  query.set('saved', '1');
  if (input?.select) query.set('select', '1');
  return `/more?${query.toString()}`;
}

export function isYouSavedSearch(params: URLSearchParams): boolean {
  return params.get('tab') === 'saved' || params.get('saved') === '1';
}

export function youLibraryTabFromSearch(
  params: URLSearchParams,
): 'products' | 'collections' {
  if (params.get('tab') === 'saved') {
    return params.get('kind') === 'products' ? 'products' : 'collections';
  }
  return params.get('tab') === 'products' ? 'products' : 'collections';
}

/** You library query. Designs must set `tab=products` — default URL is Collections. */
export function youLibraryWriteSearch(input: {
  tab: 'products' | 'collections';
  saved?: boolean;
  select?: boolean;
}): URLSearchParams {
  const next = new URLSearchParams();
  next.set('tab', input.tab);
  if (input.saved) next.set('saved', '1');
  if (input.select) next.set('select', '1');
  return next;
}
