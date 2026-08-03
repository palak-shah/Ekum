import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ReferralView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, LoadingBlock } from '@/ui/kit';

function referralUrl(token: string): string {
  return `${window.location.origin}/r/${token}`;
}

export function ReferralsPage() {
  const navigate = useNavigate();
  const referrals = useQuery({
    queryKey: ['referrals'],
    queryFn: () => api.get<ReferralView[]>('/referrals'),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Referrals"
        action={
          <button className="text-sm font-medium text-accent" onClick={() => navigate('/referrals/new')}>
            New
          </button>
        }
      />

      <Card>
        <p className="text-sm text-ink">Vouch for a business you trust.</p>
        <p className="text-xs text-muted">Share a link — trust travels through people, not cold outreach.</p>
      </Card>

      {referrals.isLoading ? (
        <LoadingBlock />
      ) : referrals.data && referrals.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {referrals.data.map((referral) => (
            <Card key={referral.id} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink">{referral.target?.name ?? 'Open invite'}</p>
              {referral.note ? <p className="text-xs text-muted">{referral.note}</p> : null}
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralUrl(referral.token)}
                  className="min-w-0 flex-1 rounded-lg bg-foam px-2 py-1.5 text-xs text-muted"
                />
                <Button
                  variant="secondary"
                  onClick={() => void navigator.clipboard?.writeText(referralUrl(referral.token))}
                >
                  Copy
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No referrals yet" message="Create a vouch link to introduce a business." />
      )}
    </div>
  );
}
