import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MASTER_CATEGORY_LABEL,
  masterCategoryDisplayLabel,
  masterCategorySlugValues,
  type MasterCategorySlug,
  type MasterCategoryView,
  type OwnCompanyProfile,
  type UpdateCompanyDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { uploadImage } from '@/lib/mediaUpload';
import { useAuth } from '@/lib/auth';
import { useMyCompany } from '@/lib/queries';
import { isOwnProfileEditing } from '@/features/settings/profileEdit';
import { YouHeaderShare } from '@/features/settings/YouHeaderShare';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Avatar, Button, Card, Field, LoadingBlock, Tag, TextArea, TextInput, cx } from '@/ui/kit';
import {
  BOTTOM_DOCK_CLEARANCE_CLASS,
  BottomTradeDock,
} from '@/features/browse/BottomTradeDock';
import { SuggestInput } from '@/ui/SuggestInput';

const FALLBACK_MASTER_OPTIONS = masterCategorySlugValues.map((slug) => ({
  slug,
  label: MASTER_CATEGORY_LABEL[slug],
}));

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ReadValue({ value }: { value: string | null | undefined }) {
  const text = value?.trim();
  return <p className="text-[15px] leading-snug text-ink">{text || '—'}</p>;
}

export function ProfilePage() {
  const company = useMyCompany();
  const { session } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const editing = isOwnProfileEditing(location.pathname, location.search);
  const focusSell = searchParams.get('focus') === 'sell';
  const sellFieldRef = useRef<HTMLDivElement>(null);
  const [sellHighlight, setSellHighlight] = useState(focusSell);
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
    masterCategories: [] as MasterCategorySlug[],
  });

  const categoriesQuery = useQuery({
    queryKey: ['catalog-master-categories'],
    queryFn: () => api.get<MasterCategoryView[]>('/catalog/master-categories'),
    staleTime: 60_000,
    retry: false,
  });
  const chipOptions =
    categoriesQuery.data && categoriesQuery.data.length > 0
      ? categoriesQuery.data.map((c) => ({
          slug: c.slug as MasterCategorySlug,
          label: c.label,
        }))
      : FALLBACK_MASTER_OPTIONS;

  const applyCompany = (data: OwnCompanyProfile) => {
    const masters = (data.masterCategories?.length
      ? data.masterCategories
      : data.superCategories) as MasterCategorySlug[];
    setForm({
      name: data.name,
      contactPerson: data.contactPerson ?? '',
      city: data.city,
      about: data.about ?? '',
      sellCategories: data.sellCategories.join(', '),
      buyCategories: data.buyCategories.join(', '),
      gstNumber: data.gstNumber ?? '',
      masterCategories: masters,
    });
  };

  useEffect(() => {
    if (company.data) applyCompany(company.data);
  }, [company.data]);

  useEffect(() => {
    if (!focusSell || company.isLoading) return;
    setSellHighlight(true);
    const handle = window.setTimeout(() => {
      sellFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    return () => window.clearTimeout(handle);
  }, [focusSell, company.isLoading]);

  const clearSellFocus = () => {
    if (!focusSell && !sellHighlight) return;
    setSellHighlight(false);
    if (focusSell) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('focus');
          return next;
        },
        { replace: true },
      );
    }
  };

  const enterEdit = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('edit', '1');
        return next;
      },
      { replace: true },
    );
  };

  const exitEdit = () => {
    if (company.data) applyCompany(company.data);
    setError(null);
    setSellHighlight(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('edit');
        next.delete('focus');
        return next;
      },
      { replace: true },
    );
  };

  const toggleMaster = (value: MasterCategorySlug) => {
    setForm((prev) => ({
      ...prev,
      masterCategories: prev.masterCategories.includes(value)
        ? prev.masterCategories.filter((item) => item !== value)
        : [...prev.masterCategories, value],
    }));
  };

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
        masterCategories: form.masterCategories,
      };
      return api.patch<OwnCompanyProfile>('/companies/me', dto);
    },
    onSuccess: () => {
      setError(null);
      showToast('Profile saved.');
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      exitEdit();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save.'),
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
    <div
      className={cx(
        'flex flex-col gap-4',
        editing ? BOTTOM_DOCK_CLEARANCE_CLASS : 'pb-8',
      )}
    >
      <PageHeader
        title="Business profile"
        onBack={editing ? exitEdit : undefined}
        action={editing ? undefined : <YouHeaderShare />}
      />

      <Card className="flex items-center gap-3">
        <Avatar
          name={company.data?.name ?? 'E'}
          imageUrl={company.data?.logoUrl}
          size={64}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-emphasis text-ink">Profile photo</p>
          <p className="text-xs text-muted">Shown in chats and your header. Optional.</p>
          {editing ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer">
                <span className="rounded-[13px] border-[1.5px] border-accent bg-surface px-3 py-1.5 text-xs font-emphasis text-accent">
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
                  className="text-xs font-body text-muted"
                  disabled={setLogo.isPending}
                  onClick={() => setLogo.mutate(null)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-emphasis text-ink">Visibility</p>
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

      <Field label="Business name">
        {editing ? (
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        ) : (
          <ReadValue value={form.name} />
        )}
      </Field>
      <Field label="Contact person">
        {editing ? (
          <TextInput
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            placeholder="How others address you"
          />
        ) : (
          <ReadValue value={form.contactPerson} />
        )}
      </Field>
      <Field label="City">
        {editing ? (
          <SuggestInput
            kind="city"
            value={form.city}
            onChange={(city) => setForm({ ...form, city })}
          />
        ) : (
          <ReadValue value={form.city} />
        )}
      </Field>
      <Field label="What do you deal in?">
        <div className="flex flex-wrap gap-2">
          {editing
            ? chipOptions.map((opt) => {
                const on = form.masterCategories.includes(opt.slug);
                return (
                  <button
                    key={opt.slug}
                    type="button"
                    onClick={() => toggleMaster(opt.slug)}
                    className={cx(
                      'rounded-full px-3 py-1.5 text-sm font-emphasis',
                      on ? 'bg-accent text-white' : 'bg-foam text-muted',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })
            : form.masterCategories.length > 0
              ? form.masterCategories.map((value) => (
                  <span
                    key={value}
                    className="rounded-full bg-accent/10 px-3 py-1.5 text-sm font-emphasis text-ink"
                  >
                    {masterCategoryDisplayLabel(value)}
                  </span>
                ))
              : (
                  <ReadValue value="" />
                )}
        </div>
      </Field>
      <div
        ref={sellFieldRef}
        id="sell-categories"
        data-testid="profile-sell-categories"
        className={cx(
          'rounded-xl transition-[box-shadow,background-color] duration-300',
          editing && sellHighlight && 'bg-accent/5 p-3 ring-2 ring-accent',
        )}
      >
        <Field
          label="Categories you sell"
          hint={
            editing
              ? sellHighlight
                ? 'Add what you sell — then buyers looking for those goods show in Explore.'
                : 'Optional. Comma-separated (e.g. sarees, kurtis).'
              : undefined
          }
        >
          {editing ? (
            <SuggestInput
              kind="category"
              mode="list"
              value={form.sellCategories}
              onChange={(sellCategories) => {
                setForm({ ...form, sellCategories });
                clearSellFocus();
              }}
              onFocus={clearSellFocus}
            />
          ) : (
            <ReadValue value={form.sellCategories} />
          )}
        </Field>
      </div>
      <Field label="Categories you buy" hint={editing ? 'Optional. Comma-separated.' : undefined}>
        {editing ? (
          <SuggestInput
            kind="category"
            mode="list"
            value={form.buyCategories}
            onChange={(buyCategories) => setForm({ ...form, buyCategories })}
          />
        ) : (
          <ReadValue value={form.buyCategories} />
        )}
      </Field>
      <Field label="GST number" hint={editing ? 'Optional — adds a verified badge.' : undefined}>
        {editing ? (
          <TextInput
            value={form.gstNumber}
            onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
          />
        ) : (
          <ReadValue value={form.gstNumber} />
        )}
      </Field>
      <Field label="About" error={editing ? error : undefined}>
        {editing ? (
          <TextArea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        ) : (
          <ReadValue value={form.about} />
        )}
      </Field>
      {editing
        ? (
            <BottomTradeDock testId="profile-update-dock" aboveAppNav={false}>
                <Button
                  fullWidth
                  data-testid="profile-update"
                  loading={save.isPending}
                  disabled={
                    !form.name.trim() ||
                    !form.city.trim() ||
                    form.masterCategories.length === 0
                  }
                  onClick={() => save.mutate()}
                >
                  Update
                </Button>
            </BottomTradeDock>
          )
        : (
            <>
              {session?.user.isPlatformAdmin ? (
                <Link
                  to="/admin"
                  data-testid="admin-console-entry"
                  className="block w-full rounded-xl border border-line bg-canvas px-4 py-3 text-center text-[15px] font-emphasis text-ink"
                >
                  Admin Console
                </Link>
              ) : null}
              <Button fullWidth data-testid="profile-edit" onClick={enterEdit}>
                Edit profile
              </Button>
            </>
          )}
    </div>
  );
}
