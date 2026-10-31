import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MASTER_CATEGORY_LABEL,
  masterCategorySlugValues,
  type AuthTokens,
  type CreateCompanyDto,
  type MasterCategorySlug,
  type MasterCategoryView,
  type OwnCompanyProfile,
} from '@ekum/domain-types';
import { queryClient } from '@/app/queryClient';
import { api, ApiError, setTokens } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { resolveInviteReturn } from '@/lib/inviteReturn';
import { OnboardingLayout } from '@/app/OnboardingLayout';
import { Button, Field, LoadingBlock, TextInput, cx } from '@/ui/kit';
import { SuggestInput } from '@/ui/SuggestInput';

const FALLBACK_OPTIONS = masterCategorySlugValues.map((slug) => ({
  slug,
  label: MASTER_CATEGORY_LABEL[slug],
}));

export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, session, refreshSession } = useAuth();
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [city, setCity] = useState('');
  const [masterCategories, setMasterCategories] = useState<MasterCategorySlug[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ['catalog-master-categories'],
    queryFn: () => api.get<MasterCategoryView[]>('/catalog/master-categories'),
    staleTime: 60_000,
    retry: false,
  });

  const chipOptions =
    categoriesQuery.data && categoriesQuery.data.length > 0
      ? categoriesQuery.data.map((c) => ({ slug: c.slug as MasterCategorySlug, label: c.label }))
      : FALLBACK_OPTIONS;

  const fromState = (location.state as { from?: string } | null)?.from ?? null;
  const inviteReturn = useMemo(
    () => resolveInviteReturn({ from: fromState }),
    [fromState],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !session) return;
    if (inviteReturn?.startsWith('/t/')) {
      navigate(inviteReturn, { replace: true });
      return;
    }
    if (!session.needsOnboarding) {
      navigate(inviteReturn ?? '/', { replace: true });
    }
  }, [status, session, inviteReturn, navigate]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas">
        <LoadingBlock label="Starting Ekum…" />
      </div>
    );
  }

  if (status === 'anonymous' || !session) {
    navigate('/login', { replace: true });
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas">
        <LoadingBlock label="Starting Ekum…" />
      </div>
    );
  }

  if (!session.needsOnboarding || inviteReturn?.startsWith('/t/')) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas">
        <LoadingBlock label="Starting Ekum…" />
      </div>
    );
  }

  const toggle = (value: MasterCategorySlug) => {
    setMasterCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const canSubmit =
    name.trim() && contactPerson.trim() && city.trim() && masterCategories.length > 0;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const dto: CreateCompanyDto = {
        name: name.trim(),
        city: city.trim(),
        contactPerson: contactPerson.trim(),
        masterCategories,
        sellCategories: [],
        buyCategories: [],
      };
      const created = await api.post<{ tokens: AuthTokens; company: OwnCompanyProfile }>(
        '/companies',
        dto,
      );
      setTokens(created.tokens);
      queryClient.setQueryData(['company', 'me'], created.company);
      await refreshSession();
      navigate(inviteReturn ?? '/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your business.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-emphasis text-ink">Set up your business</h1>
        <p className="mt-1 text-sm text-muted">Quick details. You can add the rest later.</p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Business name" required>
          <TextInput
            autoFocus
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Surat Silk House"
          />
        </Field>
        <Field label="Contact person" required>
          <TextInput
            required
            value={contactPerson}
            onChange={(event) => setContactPerson(event.target.value)}
            placeholder="Ravi"
          />
        </Field>
        <Field label="City" required>
          <SuggestInput
            kind="city"
            required
            value={city}
            onChange={setCity}
            placeholder="Surat"
          />
        </Field>
        <Field label="What do you deal in?" required hint="Select all that apply." error={error}>
          <div className="flex flex-wrap gap-2">
            {chipOptions.map((opt) => {
              const on = masterCategories.includes(opt.slug);
              return (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => toggle(opt.slug)}
                  className={cx(
                    'rounded-full px-3 py-1.5 text-sm font-emphasis',
                    on ? 'bg-accent-soft text-accent-ink' : 'bg-foam text-muted',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
        <Button type="submit" fullWidth disabled={busy || !canSubmit}>
          {busy ? 'Creating…' : 'Create business'}
        </Button>
      </form>
    </OnboardingLayout>
  );
}
