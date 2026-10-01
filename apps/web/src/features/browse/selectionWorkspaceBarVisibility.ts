/** Page owns the band above nav (desk, compose, Ask/Order). Floater must not cover it. */
export function pathOwnsBottomActionBand(pathname: string): boolean {
  if (pathname === '/orders/new' || pathname.startsWith('/orders/new/')) return true;
  if (/^\/orders\/[^/]+/.test(pathname)) return true;
  if (pathname.startsWith('/o/')) return true;
  if (pathname.startsWith('/catalog/')) return true;
  return false;
}

export function isExploreFeedPath(pathname: string): boolean {
  return pathname === '/explore';
}

export function isCompanyShopPath(pathname: string): boolean {
  return /^\/company\/[^/]+$/.test(pathname);
}

export function isDesignOrPackPath(pathname: string): boolean {
  return (
    /^\/explore\/products\/[^/]+$/.test(pathname) ||
    /^\/products\/[^/]+$/.test(pathname) ||
    /^\/collections\/[^/]+$/.test(pathname)
  );
}

/**
 * Floater only on pick surfaces: Explore; shared design set; other shop when
 * its dock is down; design / pack while Selecting.
 */
export function shouldShowSelectionWorkspaceBar(
  pathname: string,
  total: number,
  options?: { shopDockUp?: boolean; pageDockUp?: boolean; ownShop?: boolean; pageSelecting?: boolean },
): boolean {
  if (total < 1) return false;
  if (options?.shopDockUp || options?.pageDockUp) return false;
  if (pathOwnsBottomActionBand(pathname)) return false;

  if (isExploreFeedPath(pathname)) return true;
  if (pathname.startsWith('/designs/set')) return true;

  if (isCompanyShopPath(pathname)) {
    if (options?.ownShop) return false;
    return true;
  }

  if (isDesignOrPackPath(pathname)) {
    return Boolean(options?.pageSelecting);
  }

  return false;
}
