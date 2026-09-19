/**
 * BM-07: On narrow phones, attention chips + Buy/Sell on one row clip labels.
 * Always stack direction under attention (Pending / Completed).
 */
export function ordersListFilterChrome(): {
  attentionDirectionLayout: 'stacked';
} {
  return { attentionDirectionLayout: 'stacked' };
}
