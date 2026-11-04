import { Card } from '@/ui/kit';
import {
  buildTradeSummaryRows,
  type TradeSummaryRow,
} from '@/features/orders/iHandleDesk';
import type { OrderView } from '@ekum/domain-types';

type OrderTradeSummaryProps = {
  buyerName: string;
  millDesks: OrderView['millDesks'] | undefined;
  includeMillNames: boolean;
};

function SummaryRow({ row }: { row: TradeSummaryRow }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2 text-sm">
      <span className="text-muted">{row.label}</span>
      <span className="min-w-0 font-emphasis text-ink">{row.value}</span>
      {row.pill ? (
        <span className="rounded-md bg-foam px-1.5 py-0.5 text-xs font-emphasis text-muted">
          {row.pill}
        </span>
      ) : (
        <span />
      )}
    </div>
  );
}

/** Compact trip orientation above mill / You fulfilment cards. */
export function OrderTradeSummary({
  buyerName,
  millDesks,
  includeMillNames,
}: OrderTradeSummaryProps) {
  const rows = buildTradeSummaryRows({ buyerName, millDesks, includeMillNames });
  return (
    <Card className="flex flex-col gap-2" data-testid="order-trade-summary">
      {rows.map((row) => (
        <SummaryRow key={row.label} row={row} />
      ))}
    </Card>
  );
}
