/**
 * BM-07: On narrow phones, attention chips + Buy/Sell on one row clip labels
 * (e.g. Completed → "Comp"). Always stack direction under attention.
 */
export function ordersListFilterChrome(): {
  attentionDirectionLayout: 'stacked';
} {
  return { attentionDirectionLayout: 'stacked' };
}
