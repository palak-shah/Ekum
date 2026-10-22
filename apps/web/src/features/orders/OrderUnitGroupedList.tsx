import {
  createContext,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { ticketLineSkipReason, type HowManyQtyLine } from '@/features/orders/howManyLineMeta';
import type { ItemFacts } from '@/features/orders/OrderLineFacts';
import {
  OrderUnitGroups,
  OrderUnitTotal,
  type OrderUnitRole,
} from '@/features/orders/orderUnitChrome';
import { cx } from '@/ui/kit';

/** Ticket / mill-card lists — always `Order in Sets`. */
export function OrderUnitGroupedList<T>({
  items,
  unitOf,
  getKey,
  role = 'ordering',
  headingTestId = 'order-ticket-unit-heading',
  testId = 'order-ticket-unit-groups',
  children,
}: {
  items: T[];
  unitOf: (item: T) => string | null | undefined;
  getKey: (item: T) => string;
  role?: OrderUnitRole;
  headingTestId?: string;
  testId?: string;
  children: (item: T) => ReactNode;
}) {
  return (
    <OrderUnitGroups
      items={items}
      unitOf={unitOf}
      getKey={getKey}
      role={role}
      layout="cards"
      testId={testId}
      headingTestId={headingTestId}
    >
      {(item) => children(item)}
    </OrderUnitGroups>
  );
}

const UnbilledHighlight = createContext(false);

export function useTicketUnbilledHighlight(): boolean {
  return useContext(UnbilledHighlight);
}

/** Tangerine ring on uncounted lines while Missing rates is pressed. */
export function ticketUnbilledWash(
  item: HowManyQtyLine,
  highlight: boolean,
): string | undefined {
  if (!highlight || item.lineStatus === 'declined') return undefined;
  if (ticketLineSkipReason(item) == null) return undefined;
  return 'ring-2 ring-inset ring-tangerine';
}

/** Line frame that picks up the Missing rates toggle. */
export function TicketLineWash({
  item,
  className,
  children,
  ...rest
}: {
  item: HowManyQtyLine;
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const on = useTicketUnbilledHighlight();
  return (
    <div className={cx(className, ticketUnbilledWash(item, on))} {...rest}>
      {children}
    </div>
  );
}

export { OrderUnitTotal as OrderTicketQtySummary };

/** List + Total: Missing rates toggle lights uncounted rows. */
export function OrderTicketBillBlock({
  items,
  children,
}: {
  items: Array<HowManyQtyLine & ItemFacts>;
  children: ReactNode;
}) {
  const [on, setOn] = useState(false);
  return (
    <UnbilledHighlight.Provider value={on}>
      {children}
      <OrderUnitTotal
        items={items}
        missingPressed={on}
        onMissingToggle={() => setOn((prev) => !prev)}
      />
    </UnbilledHighlight.Provider>
  );
}
