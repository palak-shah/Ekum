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
import { uploadImage } from '@/lib/mediaUpload';
import { useMyCompany } from '@/lib/queries';
import { resolveTradePresence } from '@/lib/tradePresence';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Button, Card, Field, LoadingBlock, Tag, TextArea, TextInput, cx } from '@/ui/kit';
import { SuggestInput } from '@/ui/SuggestInput';

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
  const [logoBusy, setLogoBusy] = useState(false);
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
    mutationFn: (patch: {
      buyingEnabled?: boolean;
      sellingEnabled?: boolean;
      tradingEnabled?: boolean;
    }) => api.put<CompanySettingsView>('/settings', patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not update trade options.'),
  });

  const setLogo = useMutation({
    mutationFn: (logoUrl: string | null) =>
      api.patch<OwnCompanyProfile>('/companies/me', { logoUrl }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not update photo.'),
  });

  const onPickLogo = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setLogoBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      await setLogo.mutateAsync(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    } finally {
      setLogoBusy(false);
    }
  };

  if (company.isLoading) {
    return <LoadingBlock />;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Business profile" />

      <Card className="flex items-center gap-3">
        <Avatar
          name={company.data?.name ?? 'E'}
          imageUrl={company.data?.logoUrl}
          size={64}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Profile photo</p>
          <p className="text-xs text-muted">Shown in chats and your header. Optional.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer">
              <span className="rounded-[13px] border-[1.5px] border-accent bg-surface px-3 py-1.5 text-xs font-bold text-accent">
                {logoBusy || setLogo.isPending ? 'Uploading…' : 'Upload'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={logoBusy || setLogo.isPending}
                onChange={(event) => {
                  void onPickLogo(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            {company.data?.logoUrl ? (
              <button
                type="button"
                className="text-xs font-bold text-muted"
                disabled={setLogo.isPending}
                onClick={() => setLogo.mutate(null)}
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </Card>

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
            One account can buy, sell, and trade. Turn a side off if you do not need it. Creating a
            design turns selling back on.
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
        <TradeToggle
          label="I trade on Ekum"
          on={presence.trading}
          disabled={setTradeSide.isPending}
          onToggle={() => setTradeSide.mutate({ tradingEnabled: !presence.trading })}
        />
        <p className="text-xs text-muted">
          Curate packs and manage orders for buyers. Leave off if you only buy or sell your own
          catalog.
        </p>
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
        <SuggestInput
          kind="city"
          value={form.city}
          onChange={(city) => setForm({ ...form, city })}
        />
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
        <SuggestInput
          kind="category"
          mode="list"
          value={form.sellCategories}
          onChange={(sellCategories) => setForm({ ...form, sellCategories })}
        />
      </Field>
      <Field label="Fine categories you buy" hint="Optional. Comma-separated.">
        <SuggestInput
          kind="category"
          mode="list"
          value={form.buyCategories}
          onChange={(buyCategories) => setForm({ ...form, buyCategories })}
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
