import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConnectionView,
  CreateGroupThreadDto,
  ThreadSummary,
} from '@ekum/domain-types';
import { ThreadVisibility } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, Field, InlineNotice, Sheet, TextInput } from '@/ui/kit';

type Step = 'menu' | 'company' | 'group';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function StartChatSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('menu');
  const [groupTitle, setGroupTitle] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('menu');
    setGroupTitle('');
    setMemberIds([]);
    setError(null);
  }, [open]);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open,
  });
  const active = (connections.data ?? []).filter((c) => c.status === 'active');

  const startDirect = useMutation({
    mutationFn: (companyId: string) =>
      api.post<ThreadSummary>('/threads/direct', { companyId }),
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      onClose();
      navigate(`/chats/${thread.id}`);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not open chat.'),
  });

  const createGroup = useMutation({
    mutationFn: () => {
      const dto: CreateGroupThreadDto = {
        title: groupTitle.trim(),
        participantCompanyIds: memberIds,
        visibility: ThreadVisibility.Shared,
      };
      return api.post<ThreadSummary>('/threads/group', dto);
    },
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      onClose();
      navigate(`/chats/${thread.id}`);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not create group.'),
  });

  const title =
    step === 'company' ? 'Chat with a company' : step === 'group' ? 'New group' : 'New';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        step === 'group' ? (
          <div className="flex flex-col gap-2.5">
            {error ? <InlineNotice message={error} /> : null}
            <Button
              fullWidth
              disabled={
                createGroup.isPending ||
                groupTitle.trim().length < 1 ||
                memberIds.length < 1
              }
              onClick={() => createGroup.mutate()}
            >
              {createGroup.isPending ? 'Creating…' : 'Create group'}
            </Button>
          </div>
        ) : undefined
      }
    >
      {error && step !== 'group' ? <InlineNotice className="mb-2" message={error} /> : null}

      {step === 'menu' ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep('company');
            }}
            className="rounded-xl border border-line bg-surface px-3.5 py-3 text-left"
          >
            <p className="text-sm font-semibold text-ink">Chat with a company</p>
            <p className="text-xs text-muted">Open or start a direct chat</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep('group');
            }}
            className="rounded-xl border border-line bg-surface px-3.5 py-3 text-left"
          >
            <p className="text-sm font-semibold text-ink">New group</p>
            <p className="text-xs text-muted">Name it and pick connections</p>
          </button>
        </div>
      ) : null}

      {step === 'company' ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-sm font-semibold text-accent"
            onClick={() => {
              setError(null);
              setStep('menu');
            }}
          >
            ← Back
          </button>
          <ConnectionPicker
            mode="single"
            embedded
            connections={active}
            loading={connections.isPending}
            value={null}
            onChange={(companyId) => {
              if (!companyId || startDirect.isPending) return;
              setError(null);
              startDirect.mutate(companyId);
            }}
            label="Connections"
            emptyMessage="Connect with a business first — or find one in Explore."
          />
          {startDirect.isPending ? (
            <p className="text-center text-sm text-muted">Opening chat…</p>
          ) : null}
        </div>
      ) : null}

      {step === 'group' ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-sm font-semibold text-accent"
            onClick={() => {
              setError(null);
              setStep('menu');
            }}
          >
            ← Back
          </button>
          <Field label="Group name">
            <TextInput
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g. Surat buyers"
              maxLength={120}
            />
          </Field>
          <ConnectionPicker
            mode="multi"
            embedded
            connections={active}
            loading={connections.isPending}
            value={memberIds}
            onChange={setMemberIds}
            label="Members"
            emptyMessage="Connect with businesses first to add them."
          />
        </div>
      ) : null}
    </Sheet>
  );
}
