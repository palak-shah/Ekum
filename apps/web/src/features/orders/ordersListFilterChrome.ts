/**
 * BM-07: Selling / Buying / Others, then Pending / Completed counts.
 * Both rows stay inside 390px without a horizontal scrollbar.
 */
export function ordersListFilterChrome(): {
  tabRowClass: string;
  tabClass: string;
  summaryGridClass: string;
  summaryClass: string;
} {
  return {
    tabRowClass: 'grid min-w-0 grid-cols-3 border-b border-line',
    tabClass:
      'relative min-h-11 text-[15px] font-emphasis tracking-tight',
    summaryGridClass: 'grid min-w-0 grid-cols-2 gap-2',
    summaryClass:
      'min-h-11 rounded-xl border px-3 py-1.5 text-left text-[13px] font-body leading-tight',
  };
}
