/**
 * Detail / create flows use PageHeader (back + title). Hiding the shell band
 * keeps that header flush to the top — same real estate rule as a chat thread.
 */
export function pageOwnsTopChrome(pathname: string): boolean {
  if (/^\/chats\/[^/]+/.test(pathname)) return true;
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return true;
  if (pathname.startsWith('/broadcast')) return true;
  if (pathname.startsWith('/referrals')) return true;
  if (pathname.startsWith('/saved')) return true;
  if (pathname.startsWith('/selection')) return true;
  if (pathname.startsWith('/settings')) return true;
  if (pathname.startsWith('/network') || pathname.startsWith('/buyers')) return true;
  if (pathname === '/orders/new' || pathname.startsWith('/orders/new/')) return true;
  if (/^\/orders\/[^/]+/.test(pathname)) return true;
  if (/^\/collections\//.test(pathname)) return true;
  if (/^\/products\//.test(pathname)) return true;
  if (/^\/company\//.test(pathname)) return true;
  return false;
}

/** You is a Home destination — Back on the shell band, not history −1. */
export function shellShowsHomeBack(pathname: string): boolean {
  return pathname === '/more';
}

/** Sticky shell h1 on tab roots. Nested/detail routes return null (PageHeader owns the title). */
export function shellTitle(pathname: string): string | null {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/chats')) return pathname === '/chats' ? 'Chats' : null;
  if (pathname.startsWith('/orders')) return pathname === '/orders' ? 'Orders' : null;
  if (pathname.startsWith('/explore') || pathname.startsWith('/search')) return 'Explore';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/team')) return 'Team';
  if (pathname === '/more') return 'You';
  if (pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
    return null;
  }
  if (pathname.startsWith('/buyers') || pathname.startsWith('/network')) return null;
  if (pathname.startsWith('/following') || pathname.startsWith('/followers')) return null;
  if (pathname.startsWith('/catalog')) return null;
  if (pathname.startsWith('/company')) return 'Business';
  if (pathname.startsWith('/collections')) return 'Collection';
  if (pathname.startsWith('/products')) return 'Design';
  if (pathname.startsWith('/broadcast')) return 'Buyer groups';
  if (pathname.startsWith('/referrals')) return 'Invites';
  return null;
}
