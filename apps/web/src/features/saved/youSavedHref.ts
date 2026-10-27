export type YouLibraryTab = 'products' | 'collections' | 'catalogs';

/** Saved on You is the chip beside Deleted, under Collections / Catalogs / Designs. */
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

export function youLibraryTabFromSearch(params: URLSearchParams): YouLibraryTab {
  if (params.get('tab') === 'saved') {
    const kind = params.get('kind');
    if (kind === 'products') return 'products';
    if (kind === 'catalogs') return 'catalogs';
    return 'collections';
  }
  const tab = params.get('tab');
  if (tab === 'products') return 'products';
  if (tab === 'catalogs') return 'catalogs';
  return 'collections';
}

/** You library query. Designs must set `tab=products` — default URL is Collections. */
export function youLibraryWriteSearch(input: {
  tab: YouLibraryTab;
  saved?: boolean;
  select?: boolean;
  archived?: boolean;
  drafts?: boolean;
}): URLSearchParams {
  const next = new URLSearchParams();
  next.set('tab', input.tab);
  if (input.saved) next.set('saved', '1');
  if (!input.saved && input.drafts) next.set('view', 'draft');
  else if (!input.saved && input.archived) next.set('view', 'archived');
  if (input.select) next.set('select', '1');
  return next;
}
