import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RateVisibility,
  Unit,
  unitValues,
  type CompanySettingsView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { catalogRateDisplayUnit } from '@/lib/catalogRate';
import { PageHeader } from '@/ui/PageHeader';
import { Button, InlineNotice, LoadingBlock, Sheet, cx } from '@/ui/kit';
import { OptionSheetField } from '@/ui/OptionSheetField';
import { OrderDispatchFields } from '@/features/catalog/OrderDispatchFields';
import {
  DEFAULT_DISPATCH_UNIT,
  DEFAULT_SELL_AS_UNIT,
  readCompanyPublishDefaults,
  readCompanySellAsUsual,
} from '@/features/catalog/publishDefaults';
import {
  SHOP_REPOST_PACK_HINT_ON,
  SHOP_REPOST_PACK_OFF_CONFIRM_ACTION,
  SHOP_REPOST_PACK_OFF_CONFIRM_BODY,
  SHOP_REPOST_PACK_OFF_CONFIRM_TITLE,
  SHOP_REPOST_PACK_TITLE,
  isShopRepostPackAllowed,
} from '@/features/settings/shopRepostPack';
import { useToast } from '@/ui/Toast';

export function CatalogDefaultsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
  });
  const [rateVisibility, setRateVisibility] = useState<RateVisibility>(RateVisibility.OnRequest);
  const [allowForward, setAllowForward] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [unit, setUnit] = useState(DEFAULT_SELL_AS_UNIT);
  const [dispatchUnit, setDispatchUnit] = useState(DEFAULT_DISPATCH_UNIT);
  const [catalogRateUnit, setCatalogRateUnit] = useState<string>(Unit.Piece);
  const [piecesPerPack, setPiecesPerPack] = useState('');
  const [moq, setMoq] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [shopPackAllowed, setShopPackAllowed] = useState(true);
  const [packOffConfirmOpen, setPackOffConfirmOpen] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    const pub = readCompanyPublishDefaults(settings.data.tradeDefaults);
    const sell = readCompanySellAsUsual(settings.data.tradeDefaults);
    setRateVisibility(pub.rateVisibility as RateVisibility);
    setAllowForward(pub.allowForward);
    setAllowDownload(pub.allowDownload);
    setUnit(sell.unit || DEFAULT_SELL_AS_UNIT);
    setDispatchUnit(sell.dispatchUnit || DEFAULT_DISPATCH_UNIT);
    setCatalogRateUnit(sell.catalogRateUnit || Unit.Piece);
    setPiecesPerPack(sell.piecesPerPack);
    setMoq(sell.moq);
    setShopPackAllowed(isShopRepostPackAllowed(settings.data.tradeDefaults));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () =>
      api.put('/settings', {
        tradeDefaults: {
          publishDefaults: {
            rateVisibility,
            allowForward,
            allowDownload,
          },
          sellAsUsual: {
            unit,
            dispatchUnit,
            catalogRateUnit,
            piecesPerPack: piecesPerPack.trim() || undefined,
            moq: moq.trim() || undefined,
          },
        },
      }),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
    onError: (err) => {
      setSaved(false);
      setError(err instanceof ApiError ? err.message : 'Could not save defaults.');
    },
  });

  const setShopPack = useMutation({
    mutationFn: (allowed: boolean) =>
      api.patch<{ ok: true; demoted: number }>('/follows/shop-repost-pack', { allowed }),
    onSuccess: (result, allowed) => {
      setShopPackAllowed(allowed);
      setPackOffConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      if (!allowed) {
        showToast(
          result.demoted > 0
            ? `Repost off · ${result.demoted} became look-only`
            : 'Repost off for everyone',
        );
        return;
      }
      showToast('Repost available again — choose who can Repost one by one');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not update Repost.', 'danger');
    },
  });

  const onShopPackToggle = (next: boolean) => {
    if (!next && shopPackAllowed) {
      setPackOffConfirmOpen(true);
      return;
    }
    if (next && !shopPackAllowed) {
      setShopPack.mutate(true);
    }
  };

  if (settings.isLoading) return <LoadingBlock />;

  const order = unit || DEFAULT_SELL_AS_UNIT;
  const dispatch = dispatchUnit.trim() || DEFAULT_DISPATCH_UNIT;
  const ratePer =
    catalogRateUnit.trim() ||
    catalogRateDisplayUnit({
      unit: order,
      dispatchUnit: dispatch,
      catalogRateUnit,
    }) ||
    Unit.Piece;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title="Catalog defaults" />
      <p className="text-sm text-muted">
        Usual Who and sell-as for new collections when the collection does not set its own. Rate
        amounts and notes stay on each collection or design.
      </p>
      {error ? <InlineNotice message={error} /> : null}
      {saved ? <InlineNotice message="Saved" tone="muted" /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-emphasis text-ink">Who can see · buyer rights</h2>
        <div>
          <p className="mb-2 text-sm font-emphasis text-ink">Show rates?</p>
          <div className="flex flex-col gap-1.5">
            {(
              [
                [RateVisibility.OnRequest, 'On request'],
                [RateVisibility.Visible, 'Visible'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRateVisibility(value)}
                className={cx(
                  'rounded-xl border px-3 py-2.5 text-left text-sm',
                  rateVisibility === value
                    ? 'border-accent bg-accent/5 font-emphasis text-ink'
                    : 'border-line text-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={allowForward}
            onChange={(e) => setAllowForward(e.target.checked)}
          />
          <span>Buyers can add these designs to their collections</span>
        </label>
        <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={allowDownload}
            onChange={(e) => setAllowDownload(e.target.checked)}
          />
          <span>Buyers can download these designs</span>
        </label>
      </section>

      <section className="flex flex-col gap-2" data-testid="shop-repost-pack-section">
        <h2 className="text-sm font-emphasis text-ink">Repost</h2>
        <p className="text-xs text-muted">{SHOP_REPOST_PACK_HINT_ON}</p>
        <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5"
            data-testid="shop-repost-pack-toggle"
            checked={shopPackAllowed}
            disabled={setShopPack.isPending}
            onChange={(e) => onShopPackToggle(e.target.checked)}
          />
          <span>{SHOP_REPOST_PACK_TITLE}</span>
        </label>
        {!shopPackAllowed ? (
          <p className="text-xs text-muted" data-testid="shop-repost-pack-off-note">
            Repost is off. Look-only stays; turning this on does not restore Repost automatically.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-emphasis text-ink">Rate per</span>
          <OptionSheetField
            className="min-w-[7rem]"
            testId="catalog-defaults-rate-unit"
            sheetTitle="Rate per"
            ariaLabel="Rate unit"
            value={ratePer}
            options={unitValues.map((u) => ({ value: u, label: u }))}
            onChange={setCatalogRateUnit}
          />
        </div>
        <p className="text-xs text-muted">
          Default billing unit for new collections (usually pc). Order and dispatch stay in sets.
        </p>
        <OrderDispatchFields
          orderUnit={order}
          piecesPerPack={piecesPerPack}
          dispatchUnit={dispatch}
          moq={moq}
          contentsUnit={ratePer}
          onOrderUnit={setUnit}
          onPiecesPerPack={setPiecesPerPack}
          onDispatchUnit={setDispatchUnit}
          onMoq={setMoq}
        />
      </section>

      <Button fullWidth loading={save.isPending} onClick={() => save.mutate()}>
        Save defaults
      </Button>

      <Sheet
        open={packOffConfirmOpen}
        onClose={() => !setShopPack.isPending && setPackOffConfirmOpen(false)}
        title={SHOP_REPOST_PACK_OFF_CONFIRM_TITLE}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              loading={setShopPack.isPending}
              data-testid="shop-repost-pack-confirm-off"
              onClick={() => setShopPack.mutate(false)}
            >
              {SHOP_REPOST_PACK_OFF_CONFIRM_ACTION}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              disabled={setShopPack.isPending}
              onClick={() => setPackOffConfirmOpen(false)}
            >
              Keep Repost on
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">{SHOP_REPOST_PACK_OFF_CONFIRM_BODY}</p>
      </Sheet>
    </div>
  );
}
