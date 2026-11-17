import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  ProfileVisibility,
  type OwnCompanyProfile,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useCompanyId } from '@/lib/auth';
import { useMyCompany } from '@/lib/queries';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { InlineNotice, LoadingBlock, cx } from '@/ui/kit';

type Visibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

const OPTIONS = [
  {
    value: ProfileVisibility.Public,
    title: 'Public',
    hint: 'Anyone can view the full Business Profile. The business can appear in public Explore / Find discovery.',
    testId: 'profile-visibility-public',
  },
  {
    value: ProfileVisibility.Private,
    title: 'Private',
    hint: 'Only you and approved followers can view the full Business Profile. Connections alone do not grant full access. Others see a limited private view.',
    testId: 'profile-visibility-private',
  },
] as const;

function normalizeVisibility(raw: string | undefined): Visibility {
  return raw === ProfileVisibility.Private
    ? ProfileVisibility.Private
    : ProfileVisibility.Public;
}

/** After visibility flips, company profiles and discovery lists must refetch. */
export function invalidateProfileVisibilityCaches(
  queryClient: QueryClient,
  companyId: string,
) {
  void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
  void queryClient.invalidateQueries({ queryKey: ['company', companyId] });
  void queryClient.invalidateQueries({ queryKey: ['explore'] });
  void queryClient.invalidateQueries({ queryKey: ['search'] });
}

/**
 * Settings → Privacy → Profile visibility.
 * Saves only after API success — selection stays on the last saved value while pending.
 */
export function ProfileVisibilityPage() {
  const company = useMyCompany();
  const companyId = useCompanyId() ?? '';
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const saved = normalizeVisibility(company.data?.profileVisibility);

  const save = useMutation({
    mutationFn: (profileVisibility: Visibility) =>
      api.patch<OwnCompanyProfile>('/companies/me', { profileVisibility }),
    onSuccess: (data, profileVisibility) => {
      queryClient.setQueryData(['company', 'me'], data);
      if (companyId) {
        invalidateProfileVisibilityCaches(queryClient, companyId);
      } else {
        void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
        void queryClient.invalidateQueries({ queryKey: ['explore'] });
        void queryClient.invalidateQueries({ queryKey: ['search'] });
      }
      showToast(
        profileVisibility === ProfileVisibility.Private
          ? 'Profile is Private.'
          : 'Profile is Public.',
      );
    },
    onError: (err) => {
      showToast(
        err instanceof ApiError ? err.message : 'Could not update profile visibility.',
        'danger',
      );
    },
  });

  if (company.isLoading) {
    return <LoadingBlock />;
  }

  return (
    <div className="flex flex-col gap-5 pb-8" data-testid="profile-visibility-page">
      <PageHeader title="Profile visibility" />
      <p className="text-sm text-muted">
        Controls who can open your full Business Profile. Separate from collection audience and
        phone visibility.
      </p>

      {save.isError ? (
        <InlineNotice message="Could not save. Your previous setting is still active." />
      ) : null}

      <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Profile visibility">
        {OPTIONS.map((option) => {
          const selected = saved === option.value;
          const pendingThis = save.isPending && save.variables === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={option.testId}
              disabled={save.isPending || selected}
              onClick={() => {
                if (save.isPending || selected) return;
                save.mutate(option.value);
              }}
              className={cx(
                'rounded-xl border px-3 py-3 text-left disabled:opacity-60',
                selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-emphasis text-ink">{option.title}</span>
                {pendingThis ? (
                  <span className="text-xs text-muted" data-testid="profile-visibility-saving">
                    Saving…
                  </span>
                ) : selected ? (
                  <span className="text-xs font-emphasis text-accent" data-testid="profile-visibility-current">
                    Current
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
