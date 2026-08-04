import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SUPER_CATEGORY_LABEL,
  SuperCategory,
  type CompanySettingsView,
  type OwnCompanyProfile,
  type SuperCategory as SuperCategoryType,
  type UpdateCompanyDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { resolveTradePresence } from '@/lib/tradePresence';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, Field, LoadingBlock, Tag, TextArea, TextInput, cx } from '@/ui/kit';

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const SUPER_OPTIONS = Object.values(SuperCategory) as SuperCategoryType[];

export function ProfilePage() {
  const company = useMyCompany();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    city: '',
    about: '',
    sellCategories: '',
    buyCategories: '',
    gstNumber: '',
    superCategories: [] as SuperCategoryType[],
  });

  useEffect(() => {
    if (company.data) {
      setForm({
        name: company.data.name,
        contactPerson: company.data.contactPerson ?? '',
        city: company.data.city,
        about: company.data.about ?? '',
        sellCategories: company.data.sellCategories.join(', '),
        buyCategories: company.data.buyCategories.join(', '),
        gstNumber: company.data.gstNumber ?? '',
        superCategories: company.data.superCategories as SuperCategoryType[],
      });
    }
  }, [company.data]);

  const toggleSuper = (value: SuperCategoryType) => {
    setForm((prev) => ({
      ...prev,
      superCategories: prev.superCategories.includes(value)
        ? prev.superCategories.filter((item) => item !== value)
        : [...prev.superCategories, value],
    }));
  };

  const presence = resolveTradePresence(company.data);

  const save = useMutation({
    mutationFn: () => {
      const dto: UpdateCompanyDto = {
        name: form.name.trim(),
        city: form.city.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        about: form.about.trim() || null,
        sellCategories: parseList(form.sellCategories),
        buyCategories: parseList(form.buyCategories),
        gstNumber: form.gstNumber.trim() || null,
        superCategories: form.superCategories,
      };
      return api.patch<OwnCompanyProfile>('/companies/me', dto);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'me'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save.'),
  });

  const setTradeSide = useMutation({
    mutationFn: (patch: { buyingEnabled?: boolean; sellingEnabled?: boolean }) =>
      api.put<CompanySettingsView>('/settings', patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not update trade options.'),
  });

  if (company.isLoading) {
    return <LoadingBlock />;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Business profile" />

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Visibility</p>
          <p className="text-xs text-muted">
            Your phone is never shown publicly. Rates are gated to connections.
          </p>
        </div>
        {company.data?.verification === 'gst_verified' ? (
          <Tag tone="success">Verified</Tag>
        ) : (
          <Tag>Unverified</Tag>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Trade on Ekum</p>
          <p className="mt-1 text-xs text-muted">
            One account can buy and sell. Turn a side off if you do not need it. Creating a design
            turns selling back on.
          </p>
        </div>
        <TradeToggle
          label="I buy on Ekum"
          on={presence.buying}
          disabled={setTradeSide.isPending || (presence.buying && !presence.selling)}
          onToggle={() => {
            if (presence.buying && !presence.selling) return;
            setTradeSide.mutate({ buyingEnabled: !presence.buying });
          }}
        />
        <TradeToggle
          label="I sell on Ekum"
          on={presence.selling}
          disabled={setTradeSide.isPending || (presence.selling && !presence.buying)}
          onToggle={() => {
            if (presence.selling && !presence.buying) return;
            setTradeSide.mutate({ sellingEnabled: !presence.selling });
          }}
        />
      </Card>

      <Field label="Business name">
        <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Contact person">
        <TextInput
          value={form.contactPerson}
          onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          placeholder="How others address you"
        />
      </Field>
      <Field label="City">
        <TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </Field>
      <Field label="What do you deal in?">
        <div className="flex flex-wrap gap-2">
          {SUPER_OPTIONS.map((value) => {
            const on = form.superCategories.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleSuper(value)}
                className={cx(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium',
                  on ? 'bg-accent text-white' : 'bg-foam text-muted',
                )}
              >
                {SUPER_CATEGORY_LABEL[value]}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Fine categories you sell" hint="Optional. Comma-separated (e.g. sarees, kurtis).">
        <TextInput
          value={form.sellCategories}
          onChange={(e) => setForm({ ...form, sellCategories: e.target.value })}
        />
      </Field>
      <Field label="Fine categories you buy" hint="Optional. Comma-separated.">
        <TextInput
          value={form.buyCategories}
          onChange={(e) => setForm({ ...form, buyCategories: e.target.value })}
        />
      </Field>
      <Field label="GST number" hint="Optional — adds a verified badge.">
        <TextInput
          value={form.gstNumber}
          onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
        />
      </Field>
      <Field label="About" error={error}>
        <TextArea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
      </Field>
      <Button
        fullWidth
        disabled={
          !form.name.trim() ||
          !form.city.trim() ||
          form.superCategories.length === 0 ||
          save.isPending
        }
        onClick={() => save.mutate()}
      >
        {save.isPending ? 'Saving…' : 'Save profile'}
      </Button>
    </div>
  );
}

function TradeToggle({
  label,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        'flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-colors',
        on ? 'border-accent bg-foam' : 'border-line bg-surface',
        disabled && 'opacity-50',
      )}
    >
      <span className="text-sm font-medium text-ink">{label}</span>
      <span
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          on ? 'bg-accent' : 'bg-line',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            on ? 'left-5' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
