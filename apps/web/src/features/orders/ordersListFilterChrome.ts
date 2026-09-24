/**
 * BM-07: Pending/Completed + All/Buy/Sell share one compact row at 390px.
 * Status chips stay the stronger group; direction is a quieter secondary group.
 */
export function ordersListFilterChrome(): {
  attentionDirectionLayout: 'row';
  rowClass: string;
  statusChipClass: string;
  directionGroupClass: string;
  directionBtnClass: string;
} {
  return {
    attentionDirectionLayout: 'row',
    rowClass: 'flex min-w-0 w-full flex-nowrap items-center justify-between gap-2',
    statusChipClass: 'px-2.5',
    directionGroupClass:
      'flex shrink-0 rounded-full border border-line bg-surface p-0.5',
    directionBtnClass: 'rounded-full px-2 py-1 text-[11px] font-bold tracking-tight',
  };
}
