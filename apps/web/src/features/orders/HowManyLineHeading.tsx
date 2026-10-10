import {
  howManyLineExtra,
  howManySetContentsMissing,
  howManyUnitShort,
} from '@/features/orders/howManyLineMeta';

/** Name + unit on one line so “1” / Piece does not look like a broken title. */
export function HowManyLineHeading({
  name,
  unit,
  dispatchUnit,
  piecesPerPack,
  moq,
  rate,
  rateMax,
  shop,
}: {
  name: string;
  unit?: string | null;
  dispatchUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number | null;
  rate?: number | null;
  rateMax?: number | null;
  shop?: string | null;
}) {
  const soldAs = howManyUnitShort(unit);
  const extra = howManyLineExtra({ unit, dispatchUnit, piecesPerPack, moq, rate, rateMax });
  const contentsMissing = howManySetContentsMissing(unit, piecesPerPack);
  return (
    <div className="min-w-0 flex-1">
      <p className="flex min-w-0 items-baseline gap-1.5">
        <span className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-ink">
          {name}
        </span>
        {soldAs ? (
          <span className="shrink-0 text-[12px] font-medium text-muted">{soldAs}</span>
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
