/** Routes where the Selection floater must not cover page chrome (composer, docks). */
export function shouldShowSelectionWorkspaceBar(pathname: string, total: number): boolean {
  if (total < 1) return false;
  if (pathname.startsWith('/selection')) return false;
  // Open chat thread: message composer owns the band above nav.
  if (/^\/chats\/[^/]+/.test(pathname)) return false;
  // My designs Selecting = lifecycle dock; To selection navigates away.
  if (pathname === '/catalog' || pathname === '/catalog/') return false;
  // Chats list, Explore, company, etc.
  return true;
}
