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
import { Button, InlineNotice, LoadingBlock, cx } from '@/ui/kit';
import { OptionSheetField } from '@/ui/OptionSheetField';
import { OrderDispatchFields } from '@/features/catalog/OrderDispatchFields';
import {
  DEFAULT_DISPATCH_UNIT,
  DEFAULT_SELL_AS_UNIT,
  readCompanyPublishDefaults,
  readCompanySellAsUsual,
} from '@/features/catalog/publishDefaults';

export function CatalogDefaultsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
  });
  const [rateVisibility, setRateVisibility] = useState(RateVisibility.OnRequest);
  const [allowForward, setAllowForward] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [unit, setUnit] = useState(DEFAULT_SELL_AS_UNIT);
  const [dispatchUnit, setDispatchUnit] = useState(DEFAULT_DISPATCH_UNIT);
  const [catalogRateUnit, setCatalogRateUnit] = useState(Unit.Piece);
  const [piecesPerPack, setPiecesPerPack] = useState('');
  const [moq, setMoq] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    const pub = readCompanyPublishDefaults(settings.data.tradeDefaults);
    const sell = readCompanySellAsUsual(settings.data.tradeDefaults);
    setRateVisibility(pub.rateVisibility as typeof RateVisibility.OnRequest);
    setAllowForward(pub.allowForward);
    setAllowDownload(pub.allowDownload);
    setUnit(sell.unit || DEFAULT_SELL_AS_UNIT);
    setDispatchUnit(sell.dispatchUnit || DEFAULT_DISPATCH_UNIT);
    setCatalogRateUnit(sell.catalogRateUnit || Unit.Piece);
    setPiecesPerPack(sell.piecesPerPack);
    setMoq(sell.moq);
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
    </div>
  );
}
