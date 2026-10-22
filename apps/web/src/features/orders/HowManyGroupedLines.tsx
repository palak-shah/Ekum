import type { ReactNode } from 'react';
import { OrderUnitGroups } from '@/features/orders/orderUnitChrome';

/** How many / builder / Edit — always `Order in Sets`. */
export function HowManyGroupedLines<T>({
  items,
  unitOf,
  getKey,
  testId,
  lineTestId,
  lineClassName = 'px-3 py-2.5',
  renderLine,
}: {
  items: T[];
  unitOf: (item: T) => string | null | undefined;
  getKey: (item: T) => string;
  testId: string;
  lineTestId?: string;
  lineClassName?: string;
  renderLine: (item: T, index: number, last: boolean) => ReactNode;
}) {
  return (
    <OrderUnitGroups
      items={items}
      unitOf={unitOf}
      getKey={getKey}
      role="ordering"
      layout="stack"
      testId={testId}
      headingTestId="how-many-unit-heading"
      lineTestId={lineTestId}
      lineClassName={lineClassName}
    >
      {renderLine}
    </OrderUnitGroups>
  );
}
