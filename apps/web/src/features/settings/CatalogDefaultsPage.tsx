import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RateVisibility, Unit, unitValues, type CompanySettingsView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Field, InlineNotice, LoadingBlock, TextInput, cx } from '@/ui/kit';
import {
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
  const [unit, setUnit] = useState(Unit.Piece);
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
    setUnit((sell.unit as typeof Unit.Piece) || Unit.Piece);
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

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title="Catalog defaults" />
      <p className="text-sm text-muted">
        Usual Who and sell-as for new packs. Rate and notes stay on each pack or design.
      </p>
      {error ? <InlineNotice message={error} /> : null}
      {saved ? <InlineNotice message="Saved" tone="muted" /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink">Who can see · buyer rights</h2>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Show rates?</p>
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
                    ? 'border-accent bg-accent/5 font-medium text-ink'
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
        <h2 className="text-sm font-semibold text-ink">Design sell-as</h2>
        <Field label="Unit">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof Unit.Piece)}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
          >
            {unitValues.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pieces in one set">
          <TextInput
            value={piecesPerPack}
            onChange={(e) => setPiecesPerPack(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 6"
          />
        </Field>
        <Field label="Minimum order">
          <TextInput
            value={moq}
            onChange={(e) => setMoq(e.target.value)}
            inputMode="numeric"
            placeholder="Pieces"
          />
        </Field>
      </section>

      <Button fullWidth disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? 'Saving…' : 'Save defaults'}
      </Button>
    </div>
  );
}
