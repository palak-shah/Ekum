import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ReferralView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { canNativeShare, inviteShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Button, Card, EmptyState, LoadingBlock } from '@/ui/kit';

function referralUrl(token: string): string {
  return `${window.location.origin}/r/${token}`;
}

export function ReferralsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const referrals = useQuery({
    queryKey: ['referrals'],
    queryFn: () => api.get<ReferralView[]>('/referrals'),
  });

  const shareInvite = async (referral: ReferralView) => {
    const url = referralUrl(referral.token);
    const isOpen = !referral.target;
    const copy = inviteShareCopy({
      kind: isOpen ? 'connect' : 'vouch',
      companyName: referral.referrer.name,
      targetName: referral.target?.name,
    });
    try {
      const result = await shareOrCopyInvite({ url, ...copy });
      if (result === 'copied') showToast('Link copied');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast('Could not share the link.', 'danger');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Invites"
        action={
          <button className="text-sm font-medium text-accent" onClick={() => navigate('/referrals/new')}>
            New
          </button>
        }
      />

      <Card>
        <p className="text-sm text-ink">Invite partners to connect with you.</p>
        <p className="text-xs text-muted">
          They sign in and request access — you approve on Buyers. Or vouch for another business.
        </p>
      </Card>

      {referrals.isLoading ? (
        <LoadingBlock />
      ) : referrals.data && referrals.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {referrals.data.map((referral) => (
            <Card key={referral.id} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink">
                {referral.target?.name ?? 'Connect with me'}
              </p>
              {referral.note ? <p className="text-xs text-muted">{referral.note}</p> : null}
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralUrl(referral.token)}
                  className="min-w-0 flex-1 rounded-lg bg-foam px-2 py-1.5 text-xs text-muted"
                />
                {canNativeShare() ? (
                  <Button variant="secondary" onClick={() => void shareInvite(referral)}>
                    Share
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(referralUrl(referral.token)).then(() => {
                      showToast('Link copied');
                    });
                  }}
                >
                  Copy
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No invites yet"
          message="Create a connect-with-me link and share it with buyers or suppliers."
        />
      )}
    </div>
  );
}
