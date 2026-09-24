/** Routes where the Selection floater must not cover page chrome (composer, docks). */
export function shouldShowSelectionWorkspaceBar(
  pathname: string,
  total: number,
  options?: { shopDockUp?: boolean },
): boolean {
  if (total < 1) return false;
  if (pathname.startsWith('/selection')) return false;
  // Open chat thread: message composer owns the band above nav.
  if (/^\/chats\/[^/]+/.test(pathname)) return false;
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
  // Company shop trade dock owns the band.
  if (options?.shopDockUp) return false;
  // Chats list, Explore, idle company, etc.
  return true;
}
