import { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConnectionView,
  GroupInviteLinkView,
  MuteFor,
  TeamMemberView,
  ThreadDetail,
  UpdateGroupProfileDto,
} from '@ekum/domain-types';
import { useCompanyId } from '@/lib/auth';
import { useMyCompany } from '@/lib/queries';
import { useTeamCaps } from '@/lib/teamCaps';
import { api, ApiError } from '@/lib/apiClient';
import { inviteShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { PageHeader } from '@/ui/PageHeader';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { Avatar, Button, ErrorState, LoadingBlock, SearchInput, Sheet, cx } from '@/ui/kit';
import { PlusIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { ConfirmActionSheet } from '@/ui/ConfirmActionSheet';
import { GroupIdentityHero } from './GroupIdentityHero';
import { ThreadPeopleSheet } from './ThreadPeopleSheet';
import { ChatMuteDurationFlyout } from './ChatMuteDurationFlyout';
import { GroupInfoMediaPanel } from './GroupInfoMediaPanel';
import { filterGroupCompanies } from './groupInfoSearch';
import { sortGroupTeam } from './groupInfoTeam';
import {
  GROUP_INFO_TAB_LABEL,
  GROUP_INFO_TABS,
  parseGroupInfoTab,
  parseGroupMediaKind,
  type GroupInfoTab,
} from './groupInfoTabs';

const SETTING =
  'flex w-full px-3.5 py-3 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40';

export function GroupInfoPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const company = useMyCompany();
  const { isOwner } = useTeamCaps();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const tab = parseGroupInfoTab(params.get('tab'));
  const mediaKind = parseGroupMediaKind(params.get('kind'));
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addIds, setAddIds] = useState<string[]>([]);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleClone, setPeopleClone] = useState<{ threadId: string; title: string | null } | null>(
    null,
  );
  const [sharing, setSharing] = useState(false);
  const [mutePick, setMutePick] = useState(false);
  const [muteHost, setMuteHost] = useState<{
    top: number;
    left: number;
    right: number;
    bottom: number;
  } | null>(null);
  const muteRowRef = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState<'leave' | 'remove' | null>(null);

  const setTab = (next: GroupInfoTab) => {
    const copy = new URLSearchParams(params);
    if (next === 'businesses') copy.delete('tab');
    else copy.set('tab', next);
    if (next !== 'media') copy.delete('kind');
    setParams(copy, { replace: true });
  };

  const setMediaKind = (kind: ReturnType<typeof parseGroupMediaKind>) => {
    const copy = new URLSearchParams(params);
    copy.set('tab', 'media');
    if (kind) copy.set('kind', kind);
    else copy.delete('kind');
    setParams(copy, { replace: true });
  };

  const thread = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.get<ThreadDetail>(`/threads/${id}`),
  });

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: addOpen,
  });

  const inviteLink = useQuery({
    queryKey: ['thread-invite-link', id],
    queryFn: () => api.post<GroupInviteLinkView>(`/threads/${id}/invite-link`, {}),
    enabled: Boolean(id) && thread.data?.type === 'group',
    staleTime: 10 * 60_000,
  });

  const teamPeople = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get<TeamMemberView[]>('/team/members'),
    enabled: peopleOpen && isOwner,
  });

  const addShops = useMutation({
    mutationFn: (companyIds: string[]) =>
      api.post<ThreadDetail>(`/threads/${id}/participants`, { companyIds }),
    onSuccess: (detail) => {
      queryClient.setQueryData(['thread', id], detail);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      setAddOpen(false);
      setAddIds([]);
      showToast(addIds.length > 1 ? 'Businesses added' : 'Business added');
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not add.', 'danger'),
  });

  const saveProfile = useMutation({
    mutationFn: (body: UpdateGroupProfileDto) =>
      api.patch<ThreadDetail>(`/threads/${id}/group-profile`, body),
    onSuccess: (detail) => {
      queryClient.setQueryData(['thread', id], detail);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not save.', 'danger'),
  });

  const setAlert = useMutation({
    mutationFn: (payload: { alertLevel: 'all' | 'muted'; muteFor?: MuteFor }) =>
      api.patch<ThreadDetail>(`/threads/${id}/alert`, payload),
    onSuccess: (detail) => {
      queryClient.setQueryData(['thread', id], detail);
      setMutePick(false);
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not mute.', 'danger'),
  });

  const pinThread = useMutation({
    mutationFn: (pinned: boolean) => api.patch<ThreadDetail>(`/threads/${id}/pin`, { pinned }),
    onSuccess: (detail) => {
      queryClient.setQueryData(['thread', id], detail);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not update pin.', 'danger'),
  });

  const leaveThread = useMutation({
    mutationFn: () => api.post(`/threads/${id}/leave`, {}),
    onSuccess: () => {
      setConfirm(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      navigate('/chats');
    },
    onError: (err) => {
      setConfirm(null);
      showToast(err instanceof ApiError ? err.message : 'Could not leave this chat.', 'danger');
    },
  });

  const archiveGroup = useMutation({
    mutationFn: () => api.post(`/threads/${id}/archive`, {}),
    onSuccess: () => {
      setConfirm(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      navigate('/chats');
    },
    onError: (err) => {
      setConfirm(null);
      showToast(err instanceof ApiError ? err.message : 'Could not remove this group.', 'danger');
    },
  });

  const onPeopleError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.code === 'SAME_CHAT') {
      const details = err.details as { threadId?: string; title?: string | null } | undefined;
      if (details?.threadId) {
        setPeopleClone({ threadId: details.threadId, title: details.title ?? null });
        return;
      }
    }
    showToast(err instanceof ApiError ? err.message : fallback, 'danger');
  };

  const addMember = useMutation({
    mutationFn: (userId: string) =>
      api.post<ThreadDetail>(`/threads/${id}/members`, { userIds: [userId] }),
    onSuccess: (detail) => {
      setPeopleClone(null);
      queryClient.setQueryData(['thread', id], detail);
    },
    onError: (err) => onPeopleError(err, 'Could not add them.'),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api.post<ThreadDetail>(`/threads/${id}/members/remove`, { userIds: [userId] }),
    onSuccess: (detail) => {
      setPeopleClone(null);
      queryClient.setQueryData(['thread', id], detail);
    },
    onError: (err) => onPeopleError(err, 'Could not take them off.'),
  });

  const onChatIds = useMemo(() => {
    return new Set((thread.data?.participants ?? []).map((row) => row.companyId));
  }, [thread.data]);

  const addable = useMemo(
    () =>
      (connections.data ?? []).filter(
        (row) => row.status === 'active' && !onChatIds.has(row.company.id),
      ),
    [connections.data, onChatIds],
  );

  if (thread.isLoading) {
    return <LoadingBlock label="Opening group…" />;
  }
  if (thread.isError || !thread.data) {
    return (
      <>
        <PageHeader title="Group" onBack={() => navigate(`/chats/${id}`)} />
        <ErrorState message="This group isn't available." />
      </>
    );
  }

  const detail = thread.data;
  if (detail.type !== 'group') {
    return <Navigate to={`/chats/${id}`} replace />;
  }

  const rows = filterGroupCompanies(detail.participants ?? [], query);
  const teamRows = sortGroupTeam(detail.people ?? []);
  const searching = Boolean(query.trim());
  const count = filterGroupCompanies(detail.participants ?? [], '').length;
  const blurb = detail.blurb?.trim() || '';
  const muted = detail.alertLevel === 'muted';
  const groupTitle = detail.title?.trim() || 'Group';

  const shareGroup = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const cached = queryClient.getQueryData<GroupInviteLinkView>(['thread-invite-link', id]);
      const link = cached ?? inviteLink.data ?? (await api.post<GroupInviteLinkView>(`/threads/${id}/invite-link`, {}));
      const url = `${window.location.origin}${link.path}`;
      const copy = inviteShareCopy({
        kind: 'group',
        companyName: company.data?.name ?? '',
        groupName: groupTitle === 'Group' ? 'this group' : groupTitle,
      });
      const result = await shareOrCopyInvite({
        url,
        title: copy.title,
        text: copy.text,
        preferShareSheet: true,
      });
      if (result === 'copied') showToast('Link copied. Send it from WhatsApp or Messages.');
      setAddOpen(false);
      setAddIds([]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast(err instanceof ApiError ? err.message : 'Could not open share.', 'danger');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
      <PageHeader onBack={() => navigate(`/chats/${id}`)} />
      <div className="ekum-no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <GroupIdentityHero
          title={groupTitle}
          blurb={blurb}
          countLabel={`${count} ${count === 1 ? 'business' : 'businesses'}`}
          imageUrl={detail.imageUrl ?? null}
          canEdit={Boolean(detail.canManagePeople)}
          busy={saveProfile.isPending}
          onSaveTitle={(next) => saveProfile.mutate({ title: next })}
          onSaveBlurb={(next) => saveProfile.mutate({ blurb: next })}
          onSavePhoto={(url) => saveProfile.mutate({ imageUrl: url })}
          onPhotoError={(message) => showToast(message, 'danger')}
        />
        <div
          className="mb-3 flex rounded-xl bg-linen p-0.5"
          role="tablist"
          aria-label="Group"
          data-testid="group-info-tabs"
        >
          {GROUP_INFO_TABS.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              data-testid={`group-info-tab-${value}`}
              onClick={() => setTab(value)}
              className={cx(
                'min-h-9 min-w-0 flex-1 rounded-[10px] px-2 text-[13px] font-semibold tracking-tight',
                tab === value ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-muted',
              )}
            >
              {GROUP_INFO_TAB_LABEL[value]}
            </button>
          ))}
        </div>

        {tab === 'businesses' ? (
          <>
            <ListSearchRow
              className="mb-3"
              search={
                <SearchInput
                  data-testid="group-info-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search businesses"
                />
              }
              action={
                <ListSquareButton
                  aria-label="Add businesses"
                  data-testid="group-info-add"
                  onClick={() => setAddOpen(true)}
                >
                  <PlusIcon width={22} height={22} />
                </ListSquareButton>
              }
            />
            <div className="flex flex-col gap-1">
              {rows.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted">No businesses match.</p>
              ) : (
                rows.map((row) => {
                  const mine = row.companyId === companyId;
                  return (
                    <Link
                      key={row.companyId}
                      to={`/company/${row.companyId}`}
                      data-testid={`group-info-company-${row.companyId}`}
                      className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 hover:border-line hover:bg-foam/60"
                    >
                      <Avatar name={row.company.name} imageUrl={row.company.logoUrl} size={48} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold tracking-tight text-ink">
                          {row.company.name}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {mine ? 'You' : row.company.city}
                        </span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
            {!searching && (teamRows.length > 0 || detail.canManagePeople) ? (
              <section className="mt-6" data-testid="group-info-team-list">
                <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                  <h2 className="text-sm font-semibold tracking-tight text-ink">Your team</h2>
                  {detail.canManagePeople ? (
                    <button
                      type="button"
                      data-testid="group-info-team-add"
                      className="text-[13px] font-semibold text-accent"
                      onClick={() => setPeopleOpen(true)}
                    >
                      Add
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  {teamRows.length === 0 ? (
                    <p className="px-1 py-3 text-sm text-muted">Add people from your shop.</p>
                  ) : (
                    teamRows.map((person) => {
                      const canTakeOff =
                        Boolean(detail.canManagePeople) && person.role !== 'owner';
                      return (
                        <div
                          key={person.userId}
                          data-testid={`group-info-person-${person.userId}`}
                          className="flex items-center gap-3 rounded-2xl px-2 py-2"
                        >
                          <Avatar name={person.name} size={48} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold tracking-tight text-ink">
                              {person.name}
                            </span>
                            {person.role === 'owner' ? (
                              <span className="block truncate text-xs text-muted">Owner</span>
                            ) : null}
                          </span>
                          {canTakeOff ? (
                            <button
                              type="button"
                              data-testid={`group-info-person-remove-${person.userId}`}
                              aria-label={`Take ${person.name} off this chat`}
                              disabled={removeMember.isPending}
                              className="flex h-11 w-11 shrink-0 items-center justify-center text-lg font-semibold text-muted hover:text-ink disabled:opacity-40"
                              onClick={() => removeMember.mutate(person.userId)}
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {tab === 'media' ? (
          <GroupInfoMediaPanel threadId={id} kind={mediaKind} onPickKind={setMediaKind} />
        ) : null}

        {tab === 'settings' ? (
          <div
            className="overflow-hidden rounded-[14px] border border-line bg-surface"
            data-testid="group-info-settings"
          >
            <button
              ref={muteRowRef}
              type="button"
              data-testid="group-info-mute"
              disabled={setAlert.isPending}
              aria-expanded={!muted && mutePick}
              className={cx(SETTING, mutePick && !muted ? 'bg-accent/5' : '')}
              onClick={() => {
                if (muted) {
                  setAlert.mutate({ alertLevel: 'all' });
                  return;
                }
                const box = muteRowRef.current?.getBoundingClientRect();
                if (box) setMuteHost({ top: box.top, left: box.left, right: box.right, bottom: box.bottom });
                setMutePick((open) => !open);
              }}
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              data-testid="group-info-pin"
              disabled={pinThread.isPending}
              className={cx(SETTING, 'border-t border-line/70')}
              onClick={() => pinThread.mutate(!detail.pinned)}
            >
              {detail.pinned ? 'Unpin chat' : 'Pin chat'}
            </button>
            {detail.canManagePeople ? (
              <button
                type="button"
                data-testid="group-info-team"
                className={cx(SETTING, 'border-t border-line/70')}
                onClick={() => setPeopleOpen(true)}
              >
                Team on chat
              </button>
            ) : null}
            {detail.canLeave ? (
              <button
                type="button"
                data-testid="group-info-leave"
                className={cx(SETTING, 'border-t border-line/70 text-danger')}
                onClick={() => setConfirm('leave')}
              >
                Leave
              </button>
            ) : null}
            {detail.canRemoveGroup ? (
              <button
                type="button"
                data-testid="group-info-remove"
                className={cx(SETTING, 'border-t border-line/70 text-danger')}
                onClick={() => setConfirm('remove')}
              >
                Remove group
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {mutePick && !muted ? (
        <ChatMuteDurationFlyout
          host={muteHost}
          pending={setAlert.isPending}
          onPick={(muteFor) => setAlert.mutate({ alertLevel: 'muted', muteFor })}
        />
      ) : null}

      <Sheet
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddIds([]);
        }}
        title="Add businesses"
        footer={
          <Button
            fullWidth
            disabled={addIds.length === 0 || addShops.isPending}
            onClick={() => addShops.mutate(addIds)}
          >
            {addShops.isPending ? 'Adding…' : addIds.length ? `Add (${addIds.length})` : 'Add'}
          </Button>
        }
      >
        <ConnectionPicker
          mode="multi"
          embedded
          connections={addable}
          value={addIds}
          onChange={setAddIds}
          loading={connections.isLoading}
          emptyMessage="Connect with a business first, then add them here."
          findOnEkum="link"
        />
        <button
          type="button"
          data-testid="group-info-invite"
          disabled={sharing}
          onClick={() => void shareGroup()}
          className="mx-auto mt-3 block text-center text-[13px] text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-40"
        >
          {sharing ? 'Opening…' : 'Share invite'}
        </button>
      </Sheet>

      <ThreadPeopleSheet
        open={peopleOpen}
        onClose={() => {
          setPeopleOpen(false);
          setPeopleClone(null);
        }}
        people={detail.people ?? []}
        team={teamPeople.data ?? []}
        busy={addMember.isPending || removeMember.isPending}
        onAdd={(userId) => addMember.mutate(userId)}
        onRemove={(userId) => removeMember.mutate(userId)}
        existingChat={peopleClone}
        onOpenExisting={(threadId) => {
          setPeopleOpen(false);
          navigate(`/chats/${threadId}`);
        }}
      />

      <ConfirmActionSheet
        open={confirm === 'leave'}
        title="Leave this group?"
        body="Off your inbox. Other shops stay in the group."
        confirmLabel="Leave"
        testId="group-info-leave-confirm"
        busy={leaveThread.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => leaveThread.mutate()}
      />
      <ConfirmActionSheet
        open={confirm === 'remove'}
        title="Remove this group?"
        body="Gone from your inbox. Other shops keep it."
        confirmLabel="Remove group"
        testId="group-info-remove-confirm"
        busy={archiveGroup.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => archiveGroup.mutate()}
      />
    </div>
  );
}
