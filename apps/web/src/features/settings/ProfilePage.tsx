import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MASTER_CATEGORY_LABEL,
  SHOP_CLOCK_HOURS,
  SHOP_CLOCK_MINUTES,
  SHOP_WEEKDAYS,
  SHOP_WEEKDAY_LABEL,
  formatShopClock12ToHhmm,
  masterCategoryDisplayLabel,
  masterCategorySlugValues,
  normalizeWebsiteUrl,
  parseShopHhmmToClock12,
  shopHoursAreSameDay,
  type MasterCategorySlug,
  type MasterCategoryView,
  type OwnCompanyProfile,
  type ShopClock12,
  type ShopMeridiem,
  type ShopWeekday,
  type UpdateCompanyDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { useMyCompany } from '@/lib/queries';
import { isOwnProfileEditing } from '@/features/settings/profileEdit';
import { YouHeaderShare } from '@/features/settings/YouHeaderShare';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { SELECT_FIELD_CLASS } from '@/ui/fieldFill';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Field,
  LoadingBlock,
  SectionHeader,
  Tag,
  TextArea,
  TextInput,
  cx,
} from '@/ui/kit';
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
  return <p className="text-name leading-snug text-ink">{text || '—'}</p>;
}

const HOUR_SELECT_CLASS = `h-12 w-16 shrink-0 ${SELECT_FIELD_CLASS} px-2 text-[16px] text-ink`;
const MIN_SELECT_CLASS = `h-12 w-[4.75rem] shrink-0 ${SELECT_FIELD_CLASS} px-2 text-[16px] text-ink`;
const MERIDIEM_SELECT_CLASS = `h-12 w-[4.75rem] shrink-0 ${SELECT_FIELD_CLASS} px-2 text-[16px] text-ink`;

/** Opening/Closing — compact hour + quarter-hour + AM/PM; stores HH:mm 24h. */
function ShopHours12Field({
  value,
  onChange,
  testId,
  defaultMeridiem,
}: {
  value: string;
  onChange: (hhmm: string) => void;
  testId: string;
  defaultMeridiem: ShopMeridiem;
}) {
  const fromValue = value ? parseShopHhmmToClock12(value) : null;
  const [draft, setDraft] = useState<ShopClock12 | null>(fromValue);
  const draftRef = useRef<ShopClock12 | null>(fromValue);

  useEffect(() => {
    if (!value) {
      draftRef.current = null;
      setDraft(null);
      return;
    }
    if (draftRef.current && formatShopClock12ToHhmm(draftRef.current) === value) return;
    const next = parseShopHhmmToClock12(value);
    draftRef.current = next;
    setDraft(next);
  }, [value]);

  const commit = (patch: Partial<ShopClock12>) => {
    const prev = draftRef.current;
    const next: ShopClock12 = {
      hour12: patch.hour12 ?? prev?.hour12 ?? 10,
      minute: patch.minute ?? prev?.minute ?? 0,
      meridiem: patch.meridiem ?? prev?.meridiem ?? defaultMeridiem,
    };
    draftRef.current = next;
    setDraft(next);
    const hhmm = formatShopClock12ToHhmm(next);
    if (hhmm) onChange(hhmm);
  };

  const clock = draft ?? fromValue;

  return (
    <div className="flex gap-2" data-testid={testId} data-value={value || undefined}>
      <select
        className={HOUR_SELECT_CLASS}
        aria-label="Hour"
        data-testid={`${testId}-hour`}
        value={clock?.hour12 ?? ''}
        onChange={(e) => {
          const hour12 = Number(e.target.value);
          if (!Number.isFinite(hour12)) return;
          commit({ hour12 });
        }}
      >
        <option value="" disabled>
          Hour
        </option>
        {SHOP_CLOCK_HOURS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <select
        className={MIN_SELECT_CLASS}
        aria-label="Minute"
        data-testid={`${testId}-minute`}
        value={clock ? clock.minute : ''}
        onChange={(e) => {
          const minute = Number(e.target.value);
          if (!Number.isFinite(minute)) return;
          commit({ minute });
        }}
      >
        <option value="" disabled>
          Min
        </option>
        {SHOP_CLOCK_MINUTES.map((minute) => (
          <option key={minute} value={minute}>
            {String(minute).padStart(2, '0')}
          </option>
        ))}
      </select>
      <select
        className={MERIDIEM_SELECT_CLASS}
        aria-label="AM or PM"
        data-testid={`${testId}-meridiem`}
        value={clock?.meridiem ?? defaultMeridiem}
        onChange={(e) => {
          const meridiem = e.target.value === 'PM' ? 'PM' : 'AM';
          commit({ meridiem });
        }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export function ProfilePage() {
  const company = useMyCompany();
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const editing = isOwnProfileEditing(location.pathname, location.search);
  const focusSell = searchParams.get('focus') === 'sell';
  const sellFieldRef = useRef<HTMLDivElement>(null);
  const [sellHighlight, setSellHighlight] = useState(focusSell);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    city: '',
    about: '',
    sellCategories: '',
    buyCategories: '',
    gstNumber: '',
    masterCategories: [] as MasterCategorySlug[],
    opensAt: '',
    closesAt: '',
    weeklyOff: '' as ShopWeekday | '',
    addressUnit: '',
    addressStreet: '',
    addressArea: '',
    addressPincode: '',
    websiteUrl: '',
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
      opensAt: data.workingHours?.opensAt ?? '',
      closesAt: data.workingHours?.closesAt ?? '',
      weeklyOff: data.workingHours?.weeklyOff ?? '',
      addressUnit: data.shopAddress?.unit ?? '',
      addressStreet: data.shopAddress?.street ?? '',
      addressArea: data.shopAddress?.area ?? '',
      addressPincode: data.shopAddress?.pincode ?? '',
      websiteUrl: data.websiteUrl ?? '',
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
    navigate('/', { replace: true });
  };

  const toggleMaster = (value: MasterCategorySlug) => {
    setForm((prev) => ({
      ...prev,
      masterCategories: prev.masterCategories.includes(value)
        ? prev.masterCategories.filter((item) => item !== value)
        : [...prev.masterCategories, value],
    }));
  };

  const hoursError = (() => {
    if (!form.opensAt && !form.closesAt && !form.weeklyOff) return null;
    if (!form.opensAt || !form.closesAt) return 'Add both opening and closing times.';
    if (!shopHoursAreSameDay(form.opensAt, form.closesAt)) {
      return 'Closing time must be after opening time.';
    }
    return null;
  })();
  const pinError =
    form.addressPincode.trim() && !/^\d{6}$/.test(form.addressPincode.trim())
      ? 'PIN must be 6 digits.'
      : null;
  const websiteError = (() => {
    const raw = form.websiteUrl.trim();
    if (!raw) return null;
    return normalizeWebsiteUrl(raw) ? null : 'Enter a valid website.';
  })();

  const save = useMutation({
    mutationFn: () => {
      if (hoursError || pinError || websiteError) {
        throw new Error(hoursError || pinError || websiteError || 'Could not save.');
      }
      const hasHours = Boolean(form.opensAt && form.closesAt);
      const hasAddress = Boolean(
        form.addressUnit.trim() ||
          form.addressStreet.trim() ||
          form.addressArea.trim() ||
          form.addressPincode.trim(),
      );
      const dto: UpdateCompanyDto = {
        name: form.name.trim(),
        city: form.city.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        about: form.about.trim() || null,
        sellCategories: parseList(form.sellCategories),
        buyCategories: parseList(form.buyCategories),
        gstNumber: form.gstNumber.trim() || null,
        masterCategories: form.masterCategories,
        workingHours: hasHours
          ? {
              opensAt: form.opensAt,
              closesAt: form.closesAt,
              weeklyOff: form.weeklyOff || null,
            }
          : null,
        shopAddress: hasAddress
          ? {
              unit: form.addressUnit.trim() || null,
              street: form.addressStreet.trim() || null,
              area: form.addressArea.trim() || null,
              pincode: form.addressPincode.trim() || null,
            }
          : null,
        websiteUrl: form.websiteUrl.trim() ? form.websiteUrl.trim() : null,
      };
      return api.patch<OwnCompanyProfile>('/companies/me', dto);
    },
    onSuccess: () => {
      setError(null);
      showToast('Profile saved.');
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      exitEdit();
    },
    onError: (err) =>
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save.',
      ),
  });

  if (company.isLoading) {
    return <LoadingBlock />;
  }

  /** View-only profile lives on Home; keep edit / focus=sell here. */
  if (!editing) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        BOTTOM_DOCK_CLEARANCE_CLASS,
      )}
    >
      <PageHeader
        title="Business profile"
        onBack={editing ? exitEdit : undefined}
        action={editing ? undefined : <YouHeaderShare />}
      />

      <Card className="flex items-center gap-3" data-testid="profile-photo-hint">
        <Avatar
          name={company.data?.name ?? 'E'}
          imageUrl={company.data?.logoUrl}
          size={64}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-emphasis text-ink">Profile photo</p>
          <p className="text-xs text-muted">
            Change cover and photo on your{' '}
            <Link to="/" className="font-emphasis text-accent">
              Business profile
            </Link>
            .
          </p>
        </div>
      </Card>

      <Card className="flex items-center justify-between" data-testid="profile-gst-status">
        <div>
          <p className="text-sm font-emphasis text-ink">GST verification</p>
          <p className="text-xs text-muted">
            Your phone is never shown publicly. Rates are gated to connections. Profile Public /
            Private is under Settings → Privacy.
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
                      on ? 'bg-accent-soft text-accent-ink' : 'bg-foam text-muted',
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
      <SectionHeader title="Business information" />
      <Field
        label="Opening time"
        error={hoursError && form.opensAt && !form.closesAt ? hoursError : undefined}
      >
        <ShopHours12Field
          value={form.opensAt}
          onChange={(opensAt) => setForm((prev) => ({ ...prev, opensAt }))}
          testId="profile-opens-at"
          defaultMeridiem="AM"
        />
      </Field>
      <Field label="Closing time" error={hoursError ?? undefined}>
        <ShopHours12Field
          value={form.closesAt}
          onChange={(closesAt) => setForm((prev) => ({ ...prev, closesAt }))}
          testId="profile-closes-at"
          defaultMeridiem="PM"
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-emphasis text-ink">Weekly off</p>
        <div className="flex flex-wrap gap-1.5" data-testid="profile-weekly-off">
          <Chip
            active={!form.weeklyOff}
            onClick={() => setForm({ ...form, weeklyOff: '' })}
            data-testid="profile-weekly-off-none"
          >
            No weekly off
          </Chip>
          {SHOP_WEEKDAYS.map((day) => (
            <Chip
              key={day}
              active={form.weeklyOff === day}
              onClick={() => setForm({ ...form, weeklyOff: day })}
              data-testid={`profile-weekly-off-${day}`}
            >
              {SHOP_WEEKDAY_LABEL[day]}
            </Chip>
          ))}
        </div>
      </div>
      {form.opensAt || form.closesAt || form.weeklyOff ? (
        <button
          type="button"
          data-testid="profile-clear-hours"
          className="self-start text-meta font-emphasis text-accent"
          onClick={() => setForm({ ...form, opensAt: '', closesAt: '', weeklyOff: '' })}
        >
          Clear hours
        </button>
      ) : null}
      <Field label="Shop / unit / building">
        <TextInput
          value={form.addressUnit}
          onChange={(e) => setForm({ ...form, addressUnit: e.target.value })}
          data-testid="profile-address-unit"
        />
      </Field>
      <Field label="Street / market">
        <TextInput
          value={form.addressStreet}
          onChange={(e) => setForm({ ...form, addressStreet: e.target.value })}
          data-testid="profile-address-street"
        />
      </Field>
      <Field label="Area / locality">
        <TextInput
          value={form.addressArea}
          onChange={(e) => setForm({ ...form, addressArea: e.target.value })}
          data-testid="profile-address-area"
        />
      </Field>
      <Field label="PIN code" error={pinError ?? undefined}>
        <TextInput
          inputMode="numeric"
          value={form.addressPincode}
          onChange={(e) => setForm({ ...form, addressPincode: e.target.value })}
          data-testid="profile-address-pincode"
        />
      </Field>
      <Field label="Website" error={websiteError ?? undefined}>
        <TextInput
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          value={form.websiteUrl}
          onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
          placeholder="shop.example.com"
          data-testid="profile-website"
        />
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
                    form.masterCategories.length === 0 ||
                    Boolean(hoursError || pinError || websiteError)
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
                  className="block w-full rounded-xl border border-line bg-canvas px-4 py-3 text-center text-name font-emphasis text-ink"
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
