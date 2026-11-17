/**
 * BM-07: Selling / Buying / Others, then kit Pending / Completed chips.
 * Selected bar language lives in `underlineTabChrome` (shared with Home / You).
 * Both rows stay inside 390px without a horizontal scrollbar.
 */
export function ordersListFilterChrome(): {
  tabRowClass: string;
  tabClass: string;
} {
  return {
    tabRowClass: 'grid min-w-0 grid-cols-3 border-b border-line',
    tabClass:
      'relative min-h-11 text-name font-emphasis tracking-tight',
  };
}
