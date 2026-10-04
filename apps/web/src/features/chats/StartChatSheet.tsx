import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConnectionView,
  StartDirectThreadDto,
  StartDirectThreadResult,
  TeamMemberView,
  ThreadSummary,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useTeamCaps } from '@/lib/teamCaps';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, InlineNotice, SearchInput, Sheet } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import { TeamPersonRow } from '@/features/chats/TeamPersonRow';
import { directOpenToast } from './directOpenToast';

type Step = 'shops' | 'team';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** New chat from ＋ — one business only. Groups come from trader reveal on orders. */
export function StartChatSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { can, isOwner } = useTeamCaps();
  const canChat = can('chats');

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [teamQuery, setTeamQuery] = useState('');
  const [step, setStep] = useState<Step>('shops');
  const [error, setError] = useState<string | null>(null);
  const [existingThreadId, setExistingThreadId] = useState<string | null>(null);
  const [existingThreadTitle, setExistingThreadTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCompanyId(null);
    setStaffIds([]);
    setTeamQuery('');
    setStep('shops');
    setError(null);
    setExistingThreadId(null);
    setExistingThreadTitle(null);
  }, [open]);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open && canChat,
    placeholderData: (previous) => previous,
  });
  const team = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get<TeamMemberView[]>('/team/members'),
    enabled: open && canChat && isOwner,
    placeholderData: (previous) => previous,
  });

  const active = (connections.data ?? []).filter((c) => c.status === 'active');
  const staff = useMemo(
    () => (team.data ?? []).filter((row) => row.role !== 'owner'),
    [team.data],
  );
  const hasTeamStep = isOwner && staff.length > 0;
  const showTeamSearch = staff.length >= 10;
  const teamQ = showTeamSearch ? teamQuery.trim().toLowerCase() : '';
  const visibleStaff = useMemo(
    () =>
      teamQ
        ? staff.filter((row) => row.name.toLowerCase().includes(teamQ))
        : staff,
    [staff, teamQ],
  );
  const visibleIds = visibleStaff.map((row) => row.userId);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => staffIds.includes(id));

  const goToThread = (thread: ThreadSummary, toastMessage?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
    onClose();
    if (toastMessage) {
      showToast(toastMessage, 'success');
    }
    navigate(`/chats/${thread.id}`);
  };

  const businessLabel = (id: string) =>
    active.find((row) => row.company.id === id)?.company.name ?? 'business';

  const openChatWithLabel = companyId
    ? `Open chat with ${businessLabel(companyId)}`
    : 'Open chat';

  const onCloneOrError = (err: unknown) => {
    if (err instanceof ApiError && err.code === 'SAME_CHAT') {
      const details = err.details as { threadId?: string; title?: string | null } | undefined;
      if (details?.threadId) {
        setExistingThreadId(details.threadId);
        setExistingThreadTitle(details.title ?? null);
        setError(null);
        return;
      }
    }
    setExistingThreadId(null);
    setExistingThreadTitle(null);
    setError(err instanceof ApiError ? err.message : 'Could not open chat.');
  };

  const startDirect = useMutation({
    mutationFn: (payload: StartDirectThreadDto) =>
      api.post<StartDirectThreadResult>('/threads/direct', payload),
    onSuccess: (thread) => {
      const name = thread.counterpart?.name?.trim() || businessLabel(companyId ?? '');
      goToThread(thread, directOpenToast(name, thread.opened));
    },
    onError: onCloneOrError,
  });

  const pending = startDirect.isPending;

  const openDirect = (memberUserIds: string[]) => {
    if (pending || !companyId) return;
    setError(null);
    startDirect.mutate({
      companyId,
      memberUserIds: isOwner ? memberUserIds : [],
    });
  };

  const onShopsNext = () => {
    if (pending || !companyId) return;
    setError(null);
    if (hasTeamStep) {
      setStep('team');
      return;
    }
    openDirect([]);
  };

  const toggleStaff = (userId: string) => {
    setStaffIds((ids) =>
      ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId],
    );
  };

  const toggleVisibleStaff = () => {
    setStaffIds((ids) => {
      if (allVisibleSelected) {
        return ids.filter((id) => !visibleIds.includes(id));
      }
      const next = new Set(ids);
      for (const id of visibleIds) next.add(id);
      return [...next];
    });
  };

  const title = step === 'team' ? 'Add your team' : 'New chat';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      onBack={
        step === 'team'
          ? () => {
              setError(null);
              setStep('shops');
            }
          : undefined
      }
      title={title}
      panelClassName="h-[min(88dvh,36rem)]"
      footer={
        canChat ? (
          <div className="flex flex-col gap-2.5">
            {error ? <InlineNotice message={error} /> : null}
            {existingThreadId ? (
              <>
                <p className="rounded-xl bg-foam px-3 py-2.5 text-sm font-medium text-ink">
                  Same as {existingThreadTitle?.trim() || 'that chat'}.
                </p>
                <Button
                  fullWidth
                  onClick={() =>
                    goToThread(
                      { id: existingThreadId } as ThreadSummary,
                      existingThreadTitle?.trim()
                        ? `Opened chat with ${existingThreadTitle.trim()}`
                        : 'Opened chat',
                    )
                  }
                >
                  Open chat
                </Button>
              </>
            ) : step === 'team' ? (
              <Button
                fullWidth
                disabled={pending || !companyId}
                onClick={() => openDirect(staffIds)}
              >
                {pending ? 'Opening…' : openChatWithLabel}
              </Button>
            ) : (
              <Button fullWidth disabled={pending || !companyId} onClick={onShopsNext}>
                {pending
                  ? 'Opening…'
                  : hasTeamStep
                    ? companyId
                      ? 'Next'
                      : 'Pick a business'
                    : companyId
                      ? openChatWithLabel
                      : 'Pick a business'}
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {!canChat ? (
        <InlineNotice message="You cannot start chats for this business." />
      ) : (
        <>
          <div hidden={step !== 'shops'} className="flex flex-col gap-4 pb-4">
            <ConnectionPicker
              mode="single"
              embedded
              findOnEkum="link"
              connections={active}
              loading={connections.isPending && !connections.data}
              value={companyId}
              onChange={(id) => setCompanyId(id)}
              onMessageFound={(id) => setCompanyId(id)}
              label="Business"
              emptyMessage="Find a business on Ekum — or connect first."
            />
          </div>
          {hasTeamStep ? (
            <div hidden={step !== 'team'} className="flex flex-col gap-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-sm text-muted">Optional — add teammates.</p>
                {visibleStaff.length > 0 ? (
                  <button
                    type="button"
                    data-testid="start-chat-team-select-all"
                    className="shrink-0 text-xs font-bold text-accent"
                    onClick={toggleVisibleStaff}
                  >
                    {allVisibleSelected ? 'Clear' : 'Select all'}
                  </button>
                ) : null}
              </div>
              {showTeamSearch ? (
                <SearchInput
                  value={teamQuery}
                  onChange={(e) => setTeamQuery(e.target.value)}
                  placeholder="Search name…"
                  aria-label="Search your team"
                />
              ) : null}
              <div className="flex flex-col gap-2">
                {visibleStaff.length === 0 ? (
                  <p className="text-sm text-muted">No matches.</p>
                ) : (
                  visibleStaff.map((row) => {
                    const on = staffIds.includes(row.userId);
                    return (
                      <TeamPersonRow
                        key={row.userId}
                        name={row.name}
                        selected={on}
                        trailing={on ? 'Selected' : 'Add'}
                        onClick={() => toggleStaff(row.userId)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </Sheet>
  );
}
