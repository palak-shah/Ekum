import type { ReactNode } from 'react';
import { isPackOrderUnit } from '@/lib/catalogRate';
import {
  howManyLineExtra,
  howManyPackContentsLabel,
  howManySetContentsMissing,
  howManyUnitShort,
} from '@/features/orders/howManyLineMeta';
import { OrderDesignTitle } from '@/features/orders/OrderDesignTitle';
import { designSubtextClass } from '@/ui/designLineChrome';
import { CloseIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/**
 * Name only — no Piece / Metre / Set beside it.
 * Quiet line is rate when a rate exists; pack size only when sizes on the sheet differ.
 */
export function HowManyLineHeading({
  name,
  unit,
  dispatchUnit,
  catalogRateUnit,
  piecesPerPack,
  moq,
  rate,
  rateMax,
  shop,
  showPackSize = false,
}: {
  name: string;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
  shop?: string | null;
  /** When sizes differ — `₹… · 1 set = 20 pcs`, not `20 pcs · ₹`. */
  showPackSize?: boolean;
}) {
  const price = howManyLineExtra({
    unit,
    dispatchUnit,
    catalogRateUnit,
    piecesPerPack,
    moq,
    rate,
    rateMax,
  });
  const contents = showPackSize
    ? howManyPackContentsLabel(unit, piecesPerPack, dispatchUnit, catalogRateUnit)
    : null;
  const one = (howManyUnitShort(unit) ?? 'set').toLowerCase();
  const packLine = contents && isPackOrderUnit(unit) ? `1 ${one} = ${contents}` : null;
  const extra = [price, packLine].filter(Boolean).join(' · ') || null;

  return (
    <OrderDesignTitle
      name={name}
      extra={
        <>
          {shop?.trim() ? <p className={designSubtextClass}>{shop}</p> : null}
          {extra ? (
            <p className={cx('mt-0.5', designSubtextClass)} data-testid="how-many-facts">
              {extra}
            </p>
          ) : null}
        </>
      }
    />
  );
}

/** Qty row under the name: − n + (unit lives on the group or footer). */
export function HowManyQtyRow({
  unit,
  piecesPerPack,
  stepper,
}: {
  unit?: string | null;
  piecesPerPack?: number | null;
  stepper: ReactNode;
}) {
  const missing = howManySetContentsMissing(unit, piecesPerPack);
  return (
    <div
      className={cx('flex min-w-0 items-center gap-2', !missing && 'justify-end')}
      data-testid="how-many-qty-row"
    >
      {missing ? (
        <p className={cx('min-w-0 flex-1', designSubtextClass)} data-testid="how-many-set-contents-missing">
          {missing}
        </p>
      ) : null}
      {stepper}
    </div>
  );
}

/** Line-item × — top-right, beside the product name. */
export function HowManyRemoveButton({
  name,
  disabled,
  onClick,
  testId = 'how-many-remove',
}: {
  name: string;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Remove ${name}`}
      data-testid={testId}
      className="shrink-0 p-0.5 text-muted disabled:opacity-45"
      onClick={onClick}
    >
      <CloseIcon width={16} height={16} />
    </button>
  );
}
