import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompanySettingsView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Field, InlineNotice, LoadingBlock, TextInput } from '@/ui/kit';
import {
  readUnitConversions,
  type UnitConversionRow,
} from '@/features/catalog/publishDefaults';

const emptyRow = (): UnitConversionRow => ({ from: '', to: '', factor: '' });

export function UnitsSettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
  });
  const [rows, setRows] = useState<UnitConversionRow[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    const loaded = readUnitConversions(settings.data.tradeDefaults);
    setRows(loaded.length > 0 ? loaded : [emptyRow()]);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => {
      const unitConversions = rows
        .map((row) => ({
          from: row.from.trim(),
          to: row.to.trim(),
          factor: row.factor.trim(),
        }))
        .filter((row) => row.from && row.to && row.factor);
      return api.put('/settings', { tradeDefaults: { unitConversions } });
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
    onError: (err) => {
      setSaved(false);
      setError(err instanceof ApiError ? err.message : 'Could not save units.');
    },
  });

  if (settings.isLoading) return <LoadingBlock />;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title="Units" />
      <p className="text-sm text-muted">
        When you receive in one unit and deliver in another (e.g. 1 yard = 0.914 metres). Sell-as
        pack size (1 set = n pieces) stays on each design.
      </p>
      {error ? <InlineNotice message={error} /> : null}
      {saved ? <InlineNotice message="Saved" tone="muted" /> : null}

      <div className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3"
          >
            <Field label="From">
              <TextInput
                value={row.from}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, from: e.target.value };
                  setRows(next);
                }}
                placeholder="yard"
              />
            </Field>
            <Field label="To">
              <TextInput
                value={row.to}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, to: e.target.value };
                  setRows(next);
                }}
                placeholder="mtr"
              />
            </Field>
            <Field label="1 from = n to">
              <TextInput
                value={row.factor}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, factor: e.target.value };
                  setRows(next);
                }}
                inputMode="decimal"
                placeholder="0.914"
              />
            </Field>
            {rows.length > 1 ? (
              <button
                type="button"
                className="self-start text-xs font-medium text-danger"
                onClick={() => setRows(rows.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          className="self-start text-sm font-medium text-accent"
          onClick={() => setRows([...rows, emptyRow()])}
        >
          Add conversion
        </button>
      </div>

      <Button fullWidth disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? 'Saving…' : 'Save units'}
      </Button>
    </div>
  );
}
