import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CompanyPermissions,
  CreateTeamInviteResult,
  TeamMemberView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { canNativeShare, shareOrCopyInvite } from '@/lib/shareInvite';
import { useTeamCaps, type TeamCap } from '@/lib/teamCaps';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  InlineNotice,
  LoadingBlock,
  Sheet,
  TextInput,
  cx,
} from '@/ui/kit';

const CAP_LABELS: Record<TeamCap, string> = {
  uploads: 'Uploads',
  chats: 'Chats',
  orders: 'Orders',
  payments: 'Payments',
  team: 'Team',
};

function teamInviteUrl(token: string): string {
  return `${window.location.origin}/t/${token}`;
}

function roleLabel(role: string): string {
  return role === 'owner' ? 'Owner' : 'Staff';
}

export function TeamPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isOwner, can } = useTeamCaps();
  const canManage = isOwner || can('team');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<CreateTeamInviteResult | null>(null);

  const [editMember, setEditMember] = useState<TeamMemberView | null>(null);
  const [editCaps, setEditCaps] = useState<CompanyPermissions | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const members = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get<TeamMemberView[]>('/team/members'),
  });

  const createInvite = useMutation({
    mutationFn: () =>
      api.post<CreateTeamInviteResult>('/team/invites', {
        name: inviteName.trim(),
        phone: invitePhone.trim(),
      }),
    onSuccess: (result) => {
      setLastInvite(result);
      setInviteError(null);
      showToast('Invite ready — share the link.');
    },
    onError: (err) =>
      setInviteError(err instanceof ApiError ? err.message : 'Could not create invite.'),
  });

  const updateMember = useMutation({
    mutationFn: (payload: { userId: string; permissions: CompanyPermissions }) =>
      api.patch<TeamMemberView>(`/team/members/${payload.userId}`, {
        permissions: payload.permissions,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setEditMember(null);
      setEditCaps(null);
      showToast('Updated.');
    },
    onError: (err) =>
      setEditError(err instanceof ApiError ? err.message : 'Could not save.'),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => api.del(`/team/members/${userId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setEditMember(null);
      setEditCaps(null);
      showToast('Removed from team.');
    },
    onError: (err) =>
      setEditError(err instanceof ApiError ? err.message : 'Could not remove.'),
  });

  const openEdit = (member: TeamMemberView) => {
    if (!canManage || member.role === 'owner') return;
    setEditMember(member);
    setEditCaps({ ...member.permissions });
    setEditError(null);
  };

  const shareInvite = async (token: string, name: string) => {
    const url = teamInviteUrl(token);
    try {
      const result = await shareOrCopyInvite({
        url,
        title: 'Ekum — join our team',
        text: `Join ${name} on Ekum`,
      });
      if (result === 'copied') showToast('Link copied');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast('Could not share the link.', 'danger');
    }
  };

  const resetInviteSheet = () => {
    setInviteOpen(false);
    setInviteName('');
    setInvitePhone('');
    setInviteError(null);
    setLastInvite(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeader
        title="Team"
        action={
          canManage ? (
            <button
              type="button"
              className="text-sm font-medium text-accent"
              onClick={() => {
                setInviteError(null);
                setLastInvite(null);
                setInviteOpen(true);
              }}
            >
              Invite
            </button>
          ) : undefined
        }
      />

      <Card>
        <p className="text-sm text-ink">People who work under your business name.</p>
        <p className="text-xs text-muted">
          Buyers and suppliers see your company — not individual staff.
        </p>
      </Card>

      {members.isLoading ? (
        <LoadingBlock />
      ) : members.data && members.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {members.data.map((member) => (
            <button
              key={member.userId}
              type="button"
              disabled={!canManage || member.role === 'owner'}
              onClick={() => openEdit(member)}
              className={cx(
                'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left',
                canManage && member.role !== 'owner'
                  ? 'border-line bg-surface hover:bg-foam'
                  : 'border-line bg-surface',
              )}
            >
              <Avatar name={member.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{member.name}</p>
                <p className="text-xs text-muted">
                  {roleLabel(member.role)} · {member.phoneMasked}
                </p>
              </div>
              {canManage && member.role !== 'owner' ? (
                <span className="text-xs font-semibold text-accent">Edit</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="Just you" message="Invite staff when someone else helps run orders or chats." />
      )}

      <Sheet
        open={inviteOpen}
        onClose={resetInviteSheet}
        title="Invite staff"
        footer={
          lastInvite ? (
            <div className="flex flex-col gap-2">
              <input
                readOnly
                value={teamInviteUrl(lastInvite.token)}
                className="w-full rounded-lg bg-foam px-2 py-1.5 text-xs text-muted"
              />
              <div className="flex gap-2">
                {canNativeShare() ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => void shareInvite(lastInvite.token, inviteName.trim())}
                  >
                    Share
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    void navigator.clipboard
                      ?.writeText(teamInviteUrl(lastInvite.token))
                      .then(() => showToast('Link copied'));
                  }}
                >
                  Copy
                </Button>
              </div>
              <Button fullWidth onClick={resetInviteSheet}>
                Done
              </Button>
            </div>
          ) : (
            <Button
              fullWidth
              disabled={
                createInvite.isPending ||
                inviteName.trim().length < 1 ||
                invitePhone.replace(/\D/g, '').length < 10
              }
              onClick={() => createInvite.mutate()}
            >
              {createInvite.isPending ? 'Creating…' : 'Create invite link'}
            </Button>
          )
        }
      >
        {inviteError ? <InlineNotice className="mb-3" message={inviteError} /> : null}
        {!lastInvite ? (
          <div className="flex flex-col gap-3">
            <Field label="Their name">
              <TextInput
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Ravi"
                maxLength={120}
              />
            </Field>
            <Field label="Their phone" hint="They sign in with this number to join.">
              <TextInput
                inputMode="numeric"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="10-digit mobile"
                maxLength={14}
              />
            </Field>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Send this link to {inviteName.trim()}. They sign in with the phone you entered.
          </p>
        )}
      </Sheet>

      <Sheet
        open={Boolean(editMember && editCaps)}
        onClose={() => {
          setEditMember(null);
          setEditCaps(null);
          setEditError(null);
        }}
        title={editMember?.name ?? 'Staff'}
        footer={
          editMember && editCaps ? (
            <div className="flex flex-col gap-2">
              {editError ? <InlineNotice message={editError} /> : null}
              <Button
                fullWidth
                disabled={updateMember.isPending}
                onClick={() =>
                  updateMember.mutate({
                    userId: editMember.userId,
                    permissions: editCaps,
                  })
                }
              >
                {updateMember.isPending ? 'Updating…' : 'Update'}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                disabled={removeMember.isPending}
                onClick={() => removeMember.mutate(editMember.userId)}
              >
                {removeMember.isPending ? 'Removing…' : 'Remove from team'}
              </Button>
            </div>
          ) : undefined
        }
      >
        {editCaps ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">What can they do on Ekum?</p>
            {(Object.keys(CAP_LABELS) as TeamCap[]).map((cap) => {
              const on = editCaps[cap];
              return (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setEditCaps((prev) => (prev ? { ...prev, [cap]: !prev[cap] } : prev))}
                  className={cx(
                    'rounded-xl border px-3.5 py-3 text-left',
                    on ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                  )}
                >
                  <p className="text-sm font-semibold text-ink">{CAP_LABELS[cap]}</p>
                  <p className="text-xs text-muted">{on ? 'Allowed' : 'Off'}</p>
                </button>
              );
            })}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
