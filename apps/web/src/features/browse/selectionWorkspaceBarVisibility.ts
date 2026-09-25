/** Page owns the band above nav (desk, compose, Ask/Order). Floater must not cover it. */
export function pathOwnsBottomActionBand(pathname: string): boolean {
  if (pathname === '/orders/new' || pathname.startsWith('/orders/new/')) return true;
  if (/^\/orders\/[^/]+/.test(pathname)) return true;
  if (pathname.startsWith('/o/')) return true;
  if (pathname.startsWith('/designs/set')) return true;
  if (pathname.startsWith('/catalog/')) return true;
  return false;
}

/** Routes where the Selection floater must not cover page chrome (composer, docks). */
export function shouldShowSelectionWorkspaceBar(
  pathname: string,
  total: number,
  options?: { shopDockUp?: boolean; pageDockUp?: boolean },
): boolean {
  if (total < 1) return false;
  if (pathname.startsWith('/selection')) return false;
  // Open chat thread: message composer owns the band above nav.
  if (/^\/chats\/[^/]+/.test(pathname)) return false;
  if (pathOwnsBottomActionBand(pathname)) return false;
  // My designs Selecting = owner dock; Order / Curate navigate away.
  if (
    pathname === '/catalog' ||
    pathname === '/catalog/' ||
    pathname === '/more' ||
    pathname === '/saved' ||
    pathname === '/saved/'
  ) {
    return false;
  }
  // Company shop / pack / design Ask·Order dock owns the band.
  if (options?.shopDockUp || options?.pageDockUp) return false;
  // Chats list, Explore, idle company, etc.
  return true;
}
