import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SUPER_CATEGORY_LABEL,
  SuperCategory,
  type CreateCompanyDto,
  type OwnCompanyProfile,
  type SuperCategory as SuperCategoryType,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { resolveInviteReturn } from '@/lib/inviteReturn';
import { OnboardingLayout } from '@/app/OnboardingLayout';
import { Button, Field, TextInput, cx } from '@/ui/kit';
import { SuggestInput } from '@/ui/SuggestInput';

const SUPER_OPTIONS = Object.values(SuperCategory) as SuperCategoryType[];

export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, session, refreshSession } = useAuth();
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [city, setCity] = useState('');
  const [superCategories, setSuperCategories] = useState<SuperCategoryType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fromState = (location.state as { from?: string } | null)?.from ?? null;
  const inviteReturn = useMemo(
    () => resolveInviteReturn({ from: fromState }),
    [fromState],
  );

  if (status === 'anonymous' || !session) {
    navigate('/login', { replace: true });
    return null;
  }

  const toggle = (value: SuperCategoryType) => {
    setSuperCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const canSubmit =
    name.trim() && contactPerson.trim() && city.trim() && superCategories.length > 0;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const dto: CreateCompanyDto = {
        name: name.trim(),
        city: city.trim(),
        contactPerson: contactPerson.trim(),
        superCategories,
        sellCategories: [],
        buyCategories: [],
      };
      await api.post<OwnCompanyProfile>('/companies', dto);
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
        <h1 className="text-2xl font-bold text-ink">Set up your business</h1>
        <p className="mt-1 text-sm text-muted">Four quick details. You can add the rest later.</p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Business name">
          <TextInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Surat Silk House"
          />
        </Field>
        <Field label="Contact person">
          <TextInput
            value={contactPerson}
            onChange={(event) => setContactPerson(event.target.value)}
            placeholder="Ravi"
          />
        </Field>
        <Field label="City">
          <SuggestInput
            kind="city"
            value={city}
            onChange={setCity}
            placeholder="Surat"
          />
        </Field>
        <Field label="What do you deal in?" hint="Select all that apply." error={error}>
          <div className="flex flex-wrap gap-2">
            {SUPER_OPTIONS.map((value) => {
              const on = superCategories.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(value)}
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
        <Button type="submit" fullWidth disabled={busy || !canSubmit}>
          {busy ? 'Creating…' : 'Create business'}
        </Button>
      </form>
    </OnboardingLayout>
  );
}
