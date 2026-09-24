import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FollowAskView, ShopFollowerView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Avatar, Button, Card, Chip, EmptyState, FilterRail, LoadingBlock, Sheet } from '@/ui/kit';
import { followAccessLabel, followersInboxTabFromSearch } from './followersInbox';

export function FollowersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [accessFor, setAccessFor] = useState<ShopFollowerView | null>(null);
  const asks = useQuery({
    queryKey: ['follows', 'asks'],
    queryFn: () => api.get<FollowAskView[]>('/follows/asks'),
  });
  const followers = useQuery({
    queryKey: ['follows', 'followers'],
    queryFn: () => api.get<ShopFollowerView[]>('/follows/followers'),
  });

  const askedCount = asks.data?.length ?? 0;
  const tab = followersInboxTabFromSearch(searchParams.toString(), askedCount);
  const setTab = (next: 'asked' | 'following') => {
    setSearchParams(next === 'asked' ? { tab: 'asked' } : { tab: 'following' }, { replace: true });
  };

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['follows'] });
    void queryClient.invalidateQueries({ queryKey: ['explore'] });
    void queryClient.invalidateQueries({ queryKey: ['company'] });
  };

  const decide = useMutation({
    mutationFn: (payload: { followerCompanyId: string; decision: 'look' | 'pack' | 'deny' }) =>
      api.post('/follows/decide', payload),
    onSuccess: invalidate,
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not update this ask.', 'danger'),
  });

  const changeAccess = useMutation({
    mutationFn: (payload: { followerCompanyId: string; accessKind: 'look' | 'pack' }) =>
      api.patch(`/follows/${payload.followerCompanyId}/access`, {
        accessKind: payload.accessKind,
      }),
    onSuccess: () => {
      setAccessFor(null);
      invalidate();
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not change access.', 'danger'),
  });

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader title="Followers" />
      <FilterRail>
        <Chip active={tab === 'asked'} onClick={() => setTab('asked')}>
          Asked{askedCount > 0 ? ` · ${askedCount}` : ''}
        </Chip>
        <Chip active={tab === 'following'} onClick={() => setTab('following')}>
          Following you
        </Chip>
      </FilterRail>

      {tab === 'asked' ? (
        asks.isLoading ? (
          <LoadingBlock />
        ) : asks.data && asks.data.length > 0 ? (
          <div className="flex flex-col gap-2">
            {asks.data.map((ask) => (
              <Card key={ask.company.id} className="flex flex-col gap-3">
                <div data-testid="follow-ask-row" className="flex flex-col gap-3">
                  <Link
                    to={`/company/${ask.company.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Avatar name={ask.company.name} imageUrl={ask.company.logoUrl} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{ask.company.name}</p>
                      <p className="truncate text-xs text-muted">{ask.company.city}</p>
                    </div>
                  </Link>
                  <div className="flex flex-col gap-2">
                    <Button
                      fullWidth
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate({ followerCompanyId: ask.company.id, decision: 'look' })
                      }
                    >
                      Look through
                    </Button>
                    <Button
                      fullWidth
                      variant="secondary"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate({ followerCompanyId: ask.company.id, decision: 'pack' })
                      }
                    >
                      Put in a pack
                    </Button>
                    <Button
                      fullWidth
                      variant="ghost"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate({ followerCompanyId: ask.company.id, decision: 'deny' })
                      }
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No asks"
            message="When a business asks to follow you, they show up here."
          />
        )
      ) : followers.isLoading ? (
        <LoadingBlock />
      ) : followers.data && followers.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {followers.data.map((row) => (
            <Card key={row.company.id} className="flex items-center gap-3">
              <Link
                to={`/company/${row.company.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar name={row.company.name} imageUrl={row.company.logoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{row.company.name}</p>
                  <p className="truncate text-xs text-muted">
                    {row.company.city} · {followAccessLabel(row.accessKind)}
                  </p>
                </div>
              </Link>
              <Button variant="secondary" onClick={() => setAccessFor(row)}>
                Change
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No followers yet"
          message="Businesses you allow to follow you show up here."
        />
      )}

      <Sheet open={Boolean(accessFor)} onClose={() => setAccessFor(null)} title="Access">
        {accessFor ? (
          <div className="flex flex-col gap-2 pb-4">
            <p className="text-sm text-muted">{accessFor.company.name}</p>
            {(['look', 'pack'] as const).map((kind) => {
              const selected = accessFor.accessKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={changeAccess.isPending}
                  onClick={() =>
                    changeAccess.mutate({
                      followerCompanyId: accessFor.company.id,
                      accessKind: kind,
                    })
                  }
                  className={
                    selected
                      ? 'rounded-2xl border border-accent bg-accent/5 px-4 py-3 text-left text-sm font-semibold text-ink'
                      : 'rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm font-semibold text-ink'
                  }
                >
                  {followAccessLabel(kind)}
                </button>
              );
            })}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
