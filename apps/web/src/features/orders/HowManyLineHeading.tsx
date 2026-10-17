import { isPackOrderUnit } from '@/lib/catalogRate';
import {
  howManyLineExtra,
  howManyPackContentsLabel,
  howManySetContentsMissing,
  howManyUnitShort,
} from '@/features/orders/howManyLineMeta';

/**
 * Name only on pack lines (no “Set” beside it). Native lines keep Piece / Metre.
 * Quiet line is price per set — not “1 pc · ₹/pc”.
 */
export function HowManyLineHeading({
  name,
  unit,
  dispatchUnit,
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
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
  shop?: string | null;
  /** When sizes differ — `₹… · 1 set = 20 pcs`, not `20 pcs · ₹` (that reads as price for those pcs). */
  showPackSize?: boolean;
}) {
  const soldAs = isPackOrderUnit(unit) ? null : howManyUnitShort(unit);
  const price = howManyLineExtra({ unit, dispatchUnit, piecesPerPack, moq, rate, rateMax });
  const contents = showPackSize
    ? howManyPackContentsLabel(unit, piecesPerPack, dispatchUnit)
    : null;
  const one = (howManyUnitShort(unit) ?? 'set').toLowerCase();
  const packLine = contents ? `1 ${one} = ${contents}` : null;
  const extra = [price, packLine].filter(Boolean).join(' · ') || null;
  const contentsMissing = howManySetContentsMissing(unit, piecesPerPack);

  return (
    <div className="min-w-0 flex-1">
      <p className="flex min-w-0 items-baseline gap-1.5">
        <span className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-ink">
          {name}
        </span>
        {soldAs ? (
          <span
            className="shrink-0 text-[12px] font-medium text-muted"
            data-testid="how-many-sold-as"
          >
            {soldAs}
          </span>
        ) : null}
      </p>
      {shop?.trim() ? <p className="truncate text-[12px] text-muted">{shop}</p> : null}
      {extra ? (
        <p className="mt-0.5 truncate text-[12px] text-muted" data-testid="how-many-facts">
          {extra}
        </p>
      ) : null}
      {contentsMissing ? (
        <p
          className="mt-0.5 text-[12px] font-medium text-muted"
          data-testid="how-many-set-contents-missing"
        >
          {contentsMissing}
        </p>
      ) : null}
    </div>
  );
}
