import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FollowAskView, ShopFollowerView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import {
  Avatar,
  Card,
  Chip,
  EmptyState,
  FilterRail,
  LoadingBlock,
  SearchInput,
} from '@/ui/kit';
import { ListSearchRow } from '@/ui/ListSearchRow';
import { FollowAskDecideRow, FollowAskHeader, FollowGrantChecks } from '@/features/chats/FollowAskDecideRow';
import { type FollowAskGrants } from '@/features/chats/followAskDecide';
import {
  filterTheySeeMine,
  followersInboxTabFromSearch,
  sortAsksNewestFirst,
} from './followersInbox';
import { invalidateFollowCatalog } from './invalidateFollowCatalog';
import { THEY_SEE_MINE } from './networkSeeLabels';

function grantsFromRow(row: ShopFollowerView): FollowAskGrants {
  if (row.stopped) return { see: false, share: false };
  return { see: true, share: row.accessKind === 'pack' };
}

export function FollowersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [listSearch, setListSearch] = useState('');
  const deferredSearch = useDeferredValue(listSearch);
  const asks = useQuery({
    queryKey: ['follows', 'asks'],
    queryFn: () => api.get<FollowAskView[]>('/follows/asks'),
  });
  const followers = useQuery({
    queryKey: ['follows', 'followers'],
    queryFn: () => api.get<ShopFollowerView[]>('/follows/followers'),
  });

  const askedCount = asks.data?.length ?? 0;
  const askedOnly = followersInboxTabFromSearch(searchParams.toString()) === 'asked';
  const visibleAsks = useMemo(
    () => sortAsksNewestFirst(filterTheySeeMine(asks.data ?? [], deferredSearch)),
    [asks.data, deferredSearch],
  );
  const visibleFollowers = useMemo(
    () => filterTheySeeMine(followers.data ?? [], deferredSearch),
    [followers.data, deferredSearch],
  );

  const invalidate = () => {
    invalidateFollowCatalog(queryClient);
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
    onSuccess: invalidate,
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Could not change what they can do.',
        'danger',
      ),
  });

  const showChips = askedCount > 0 || askedOnly;
  const listLoading = askedOnly ? asks.isLoading : asks.isLoading || followers.isLoading;
  const hasVisibleAsks = visibleAsks.length > 0;
  const hasVisibleFollowers = !askedOnly && visibleFollowers.length > 0;
  const typed = deferredSearch.trim().length > 0;
  const emptyMatch =
    typed && !hasVisibleAsks && (askedOnly || !hasVisibleFollowers);
  const emptyAll =
    !typed &&
    !hasVisibleAsks &&
    !hasVisibleFollowers &&
    !(askedOnly ? asks.data?.length : (asks.data?.length ?? 0) + (followers.data?.length ?? 0));

  return (
    <div className="flex flex-col gap-4 pb-36">
      <PageHeader title={THEY_SEE_MINE.title} />
      <ListSearchRow
        search={
          <SearchInput
            data-testid="they-see-mine-search"
            aria-label="Find businesses"
            placeholder="Find businesses"
            value={listSearch}
            onChange={(event) => setListSearch(event.target.value)}
          />
        }
      />
      {showChips ? (
        <FilterRail>
          <Chip
            compact
            active={!askedOnly}
            onClick={() => setSearchParams({}, { replace: true })}
          >
            All
          </Chip>
          <Chip
            compact
            active={askedOnly}
            data-testid="they-see-mine-asked"
            onClick={() => setSearchParams({ tab: 'asked' }, { replace: true })}
          >
            Asked{askedCount > 0 ? ` · ${askedCount}` : ''}
          </Chip>
        </FilterRail>
      ) : null}

      {listLoading ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-2">
          {visibleAsks.map((ask) => (
            <Card key={ask.company.id} className="!p-3 flex flex-col gap-2">
              <div data-testid="follow-ask-row" className="flex flex-col gap-2">
                <FollowAskHeader
                  name={ask.company.name}
                  logoUrl={ask.company.logoUrl}
                  to={`/company/${ask.company.id}`}
                />
                <FollowAskDecideRow
                  disabled={decide.isPending}
                  onAllow={(decision) =>
                    decide.mutate({ followerCompanyId: ask.company.id, decision })
                  }
                  onDecline={() =>
                    decide.mutate({ followerCompanyId: ask.company.id, decision: 'deny' })
                  }
                />
              </div>
            </Card>
          ))}
          {!askedOnly
            ? visibleFollowers.map((row) => (
                <div key={row.company.id} data-testid={`follow-allowed-row-${row.company.id}`}>
                  <Card className="!p-3 flex items-center gap-2.5">
                    <Link
                      to={`/company/${row.company.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2.5"
                    >
                      <Avatar name={row.company.name} imageUrl={row.company.logoUrl} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{row.company.name}</p>
                        <p className="truncate text-xs text-muted">{row.company.city}</p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5">
                      <FollowGrantChecks
                        compact
                        grants={grantsFromRow(row)}
                        disabled={changeAccess.isPending || decide.isPending}
                        locked={row.stopped ? [] : ['see']}
                        testIdPrefix={`follow-allowed-grant-${row.company.id}`}
                        onToggle={(id) => {
                          if (row.stopped) {
                            if (id !== 'see' && id !== 'share') return;
                            decide.mutate({
                              followerCompanyId: row.company.id,
                              decision: id === 'share' ? 'pack' : 'look',
                            });
                            return;
                          }
                          if (id !== 'share') return;
                          changeAccess.mutate({
                            followerCompanyId: row.company.id,
                            accessKind: row.accessKind === 'pack' ? 'look' : 'pack',
                          });
                        }}
                      />
                      {row.stopped ? (
                        <span className="inline-flex min-h-6 w-[4.5rem] items-center text-[13px] font-medium text-muted">
                          Stopped
                        </span>
                      ) : (
                        <button
                          type="button"
                          aria-label="Stop them seeing"
                          className="inline-flex min-h-6 w-[4.5rem] items-center text-[13px] font-medium text-muted disabled:opacity-45"
                          disabled={decide.isPending}
                          onClick={() =>
                            decide.mutate(
                              { followerCompanyId: row.company.id, decision: 'deny' },
                              { onSuccess: () => showToast('Stopped them seeing.') },
                            )
                          }
                        >
                          Stop
                        </button>
                      )}
                    </div>
                  </Card>
                </div>
              ))
            : null}
          {emptyMatch ? (
            <EmptyState title="No businesses match" message="Try another name or city." />
          ) : null}
          {askedOnly && !typed && !hasVisibleAsks && !asks.isLoading ? (
            <EmptyState
              title="No asks"
              message="When a business asks to see your collections, they show up here."
            />
          ) : null}
          {!askedOnly && emptyAll ? (
            <EmptyState
              title="No one yet"
              message="Businesses you allow to see your collections show up here."
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
