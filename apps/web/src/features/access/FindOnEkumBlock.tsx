import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccessRequestView,
  CompanyCard,
  ConnectionView,
  CursorPage,
  ReferralView,
} from '@ekum/domain-types';
import { DEFAULT_ACCESS_REQUEST_NOTE, resolveAccessRequestNote } from '@/lib/accessRequestNote';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { inviteShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { FindInExploreLink } from '@/ui/FindInExploreLink';
import { Avatar, TextInput, cx } from '@/ui/kit';
import { isPhoneLikeQuery } from './findOnEkumQuery';

type Props = {
  /** Already-connected hit — add/select like a connection row. */
  onSelectConnected: (companyId: string) => void;
  /** Unconnected (or any) Message — open/start a direct thread. */
  onMessage?: (companyId: string) => void;
  connectedLabel?: string;
  /** True after a finished search with zero hits (clears when query short or hits return). */
  onMissChange?: (miss: boolean) => void;
  /** `field` = always-on search (other pickers). `link` = Chats ＋. */
  variant?: 'field' | 'link';
  /** Business search text from the parent picker (link mode). */
  externalQuery?: string;
  /** Shops already on the connection list — omit from Find results. */
  excludeCompanyIds?: string[];
  /** After Find is opened, always offer share-invite (Chats ＋). */
  inviteAlways?: boolean;
};

export function FindOnEkumBlock({
  onSelectConnected,
  onMessage,
  connectedLabel = 'Select',
  onMissChange,
  variant = 'field',
  externalQuery = '',
  excludeCompanyIds = [],
  inviteAlways = false,
}: Props) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const myCompany = useMyCompany();
  const [raw, setRaw] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const localQ = useDeferredValue(raw.trim());
  const extQ = externalQuery.trim();
  const q = variant === 'link' ? (extQ.length >= 2 ? extQ : localQ) : localQ;
  const showField = variant === 'field' || (linkOpen && extQ.length < 2);
  const searchReady = variant === 'field' || linkOpen;
  const enabled = searchReady && q.length >= 2;

  const search = useQuery({
    queryKey: ['search', 'company', q],
    queryFn: () =>
      api.get<CursorPage<CompanyCard>>('/search', { q, type: 'company', limit: 8 }),
    enabled,
  });

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });

  const outgoing = useQuery({
    queryKey: ['access-requests', 'outgoing'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/outgoing'),
  });

  const requestAccess = useMutation({
    mutationFn: (companyId: string) =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId: companyId,
        note: resolveAccessRequestNote(DEFAULT_ACCESS_REQUEST_NOTE),
      }),
    onSuccess: () => {
      showToast('Request sent — they will see it in chat.');
      void queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['connections'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not send request.', 'danger');
    },
  });

  const sendInvite = useMutation({
    mutationFn: () => api.post<ReferralView>('/referrals', {}),
    onSuccess: async (referral) => {
      const url = `${window.location.origin}/r/${referral.token}`;
      const copy = inviteShareCopy({
        kind: 'connect',
        companyName: myCompany.data?.name ?? referral.referrer.name,
      });
      try {
        const result = await shareOrCopyInvite({ url, ...copy });
        if (result === 'copied') showToast('Link copied');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        showToast('Could not share the link.', 'danger');
      }
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not create the link.', 'danger');
    },
  });

  const listed = new Set(excludeCompanyIds);
  const results = (search.data?.results ?? []).filter((row) => !listed.has(row.id));
  const searchMiss =
    enabled && search.isFetched && !search.isPending && !search.isError && results.length === 0;

  useEffect(() => {
    onMissChange?.(searchMiss);
    return () => onMissChange?.(false);
  }, [onMissChange, searchMiss]);

  const connectedIds = new Set(
    (connections.data ?? [])
      .filter((row) => row.status === 'active')
      .map((row) => row.company.id),
  );
  const pendingIds = new Set(
    (outgoing.data ?? [])
      .filter((row) => row.status === 'pending')
      .map((row) => row.company.id),
  );

  const inviteButton =
    inviteAlways && searchReady ? (
      <button
        type="button"
        data-testid="find-on-ekum-invite"
        className="self-start text-sm font-bold text-accent disabled:opacity-45"
        disabled={sendInvite.isPending}
        onClick={() => sendInvite.mutate()}
      >
        {sendInvite.isPending ? 'Preparing…' : 'Send invite'}
      </button>
    ) : null;

  const resultsBlock = !enabled ? null : search.isPending ? (
    <p className="text-sm text-muted">Searching…</p>
  ) : search.isError ? (
    <p className="text-sm text-danger">Could not search. Try again.</p>
  ) : results.length > 0 ? (
    <div className="flex flex-col gap-1.5">
      {results.map((company) => {
        const connected = connectedIds.has(company.id);
        const pending = pendingIds.has(company.id);
        return (
          <div
            key={company.id}
            className={cx(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5',
              connected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
            )}
          >
            <Avatar name={company.name} imageUrl={company.logoUrl} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{company.name}</p>
              <p className="truncate text-xs text-muted">{company.city}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {connected ? (
                <button
                  type="button"
                  className="text-xs font-bold text-accent"
                  onClick={() => onSelectConnected(company.id)}
                >
                  {connectedLabel}
                </button>
              ) : pending ? (
                <span className="text-xs text-muted">Requested</span>
              ) : (
                <button
                  type="button"
                  disabled={requestAccess.isPending}
                  className="text-xs font-bold text-accent disabled:opacity-45"
                  onClick={() => requestAccess.mutate(company.id)}
                >
                  {requestAccess.isPending && requestAccess.variables === company.id
                    ? 'Sending…'
                    : 'Request access'}
                </button>
              )}
              {onMessage && !connected ? (
                <button
                  type="button"
                  className="text-xs font-bold text-accent"
                  onClick={() => onMessage(company.id)}
                >
                  Message
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  ) : isPhoneLikeQuery(q) && !inviteAlways ? (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">Not on Ekum yet.</p>
      <FindInExploreLink
        href="/referrals/new"
        label="Send invite link"
        variant="secondary"
      />
    </div>
  ) : searchMiss ? (
    <p className="text-sm text-muted">
      {isPhoneLikeQuery(q)
        ? 'Not on Ekum yet.'
        : 'No match — try another name, or browse Explore.'}
    </p>
  ) : null;

  return (
    <div className="flex flex-col gap-2" data-testid="find-on-ekum">
      {variant === 'field' ? (
        <>
          <p className="text-sm font-medium text-ink">Find on Ekum</p>
          <TextInput
            type="search"
            autoComplete="off"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Name, mobile, or GST…"
            aria-label="Find on Ekum"
            className="w-full"
          />
        </>
      ) : (
        <>
          <button
            type="button"
            data-testid="find-on-ekum-link"
            className="self-start text-sm font-bold text-accent"
            onClick={() => setLinkOpen(true)}
          >
            Find on Ekum
          </button>
          {showField ? (
            <TextInput
              type="search"
              autoComplete="off"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Name, mobile, or GST…"
              aria-label="Find on Ekum"
              className="w-full"
            />
          ) : null}
        </>
      )}

      {searchReady ? resultsBlock : null}
      {inviteButton}
    </div>
  );
}
