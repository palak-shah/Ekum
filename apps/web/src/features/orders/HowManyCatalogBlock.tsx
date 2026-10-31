import { MEDIA_VARIANT, type ProductView } from '@ekum/domain-types';
import { HowManyQtyRow } from '@/features/orders/HowManyLineHeading';
import { QtyStepper } from '@/features/orders/QtyStepper';
import { howManyLineExtra, qtyCountNoun } from '@/features/orders/howManyLineMeta';
import { ManagedImage } from '@/ui/ManagedImage';

export type HowManyCatalogProduct = ProductView & {
  catalogWhole?: boolean;
  catalogName?: string | null;
};

export function HowManyCatalogBlock({
  name,
  members,
  quantity,
  disabled,
  onQty,
}: {
  name: string;
  members: HowManyCatalogProduct[];
  quantity: number | null;
  disabled?: boolean;
  onQty: (next: number | null) => void;
}) {
  const lead = members[0];
  if (!lead) return null;
  const noun = qtyCountNoun(lead.unit);
  const extra = howManyLineExtra({
    unit: lead.unit,
    dispatchUnit: lead.dispatchUnit,
    catalogRateUnit: lead.catalogRateUnit,
    piecesPerPack: lead.piecesPerPack,
    rate: lead.rate,
    rateMax: lead.rateMax,
  });
  return (
    <div className="flex flex-col gap-3" data-testid="how-many-catalog">
      <HowManyQtyRow
        unit={lead.unit}
        piecesPerPack={lead.piecesPerPack}
        stepper={
          <QtyStepper
            value={quantity}
            disabled={disabled}
            aria-label={`${noun} for ${name}`}
            onChange={onQty}
          />
        }
      />
      {extra ? (
        <p className="text-meta font-body leading-snug text-muted" data-testid="how-many-catalog-rate">
          {extra}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2 pb-1" data-testid="how-many-catalog-members">
        {members.map((product) => {
          const thumb = product.images[0] ?? null;
          return (
            <li key={product.id} className="flex items-center gap-3" data-testid="how-many-catalog-member">
              {thumb ? (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-foam">
                  <ManagedImage
                    src={thumb}
                    alt=""
                    variant={MEDIA_VARIANT.Thumbnail1}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-sm font-body text-muted">
                  {product.name.charAt(0)}
                </div>
              )}
              <p className="min-w-0 flex-1 text-name font-emphasis leading-snug text-ink">{product.name}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
