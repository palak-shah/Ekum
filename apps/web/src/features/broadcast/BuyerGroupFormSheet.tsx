import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BroadcastListView, ConnectionView, UpsertBroadcastListDto } from '@ekum/domain-types';
import { RateVisibility } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, Field, Sheet, TextInput, cx } from '@/ui/kit';
import { useToast } from '@/ui/Toast';

type DraftGroup = {
  id?: string;
  name: string;
  memberCompanyIds: string[];
  useOverride: boolean;
  defaultRateVisibility: string;
  allowForward: boolean;
};

const emptyDraft = (): DraftGroup => ({
  name: '',
  memberCompanyIds: [],
  useOverride: false,
  defaultRateVisibility: RateVisibility.OnRequest,
  allowForward: true,
});

function draftFromList(list: BroadcastListView): DraftGroup {
  const useOverride =
    list.defaultRateVisibility != null || list.allowForward != null;
  return {
    id: list.id,
    name: list.name,
    memberCompanyIds: [...list.memberCompanyIds],
    useOverride,
    defaultRateVisibility: list.defaultRateVisibility ?? RateVisibility.OnRequest,
    allowForward: list.allowForward ?? true,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, sheet edits this group; otherwise creates. */
  editing?: BroadcastListView | null;
  onSaved?: (list: BroadcastListView) => void;
  /** Show delete when editing (Broadcast manage page). */
  allowDelete?: boolean;
};

export function BuyerGroupFormSheet({
  open,
  onClose,
  editing = null,
  onSaved,
  allowDelete = false,
}: Props) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<DraftGroup>(emptyDraft());

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? draftFromList(editing) : emptyDraft());
  }, [open, editing]);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open,
  });
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });

  const save = useMutation({
    mutationFn: async () => {
      const dto: UpsertBroadcastListDto = {
        name: draft.name.trim(),
        memberCompanyIds: draft.memberCompanyIds,
        defaultRateVisibility: draft.useOverride
          ? (draft.defaultRateVisibility as UpsertBroadcastListDto['defaultRateVisibility'])
          : null,
        allowForward: draft.useOverride ? draft.allowForward : null,
      };
      if (draft.id) {
        return api.put<BroadcastListView>(`/broadcasts/lists/${draft.id}`, dto);
      }
      return api.post<BroadcastListView>('/broadcasts/lists', dto);
    },
    onSuccess: (list) => {
      invalidate();
      showToast(draft.id ? 'Group updated' : 'Group created');
      onClose();
      onSaved?.(list);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/broadcasts/lists/${id}`),
    onSuccess: () => {
      invalidate();
      showToast('Group deleted');
      onClose();
    },
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={draft.id ? 'Edit buyer group' : 'New buyer group'}
    >
      <div className="flex flex-col gap-3">
        <Field label="Group name">
          <TextInput
            value={draft.name}
            onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
            placeholder="Loyal retailers"
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Publish defaults</p>
          <div className="flex flex-col gap-1.5">
            {(
              [
                [false, 'Same as my usual'],
                [true, 'Different for this group'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, useOverride: value }))}
                className={cx(
                  'rounded-xl border px-3 py-2.5 text-left text-sm',
                  draft.useOverride === value
                    ? 'border-accent bg-accent/5 font-medium text-ink'
                    : 'border-line text-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {draft.useOverride ? (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Show rates</p>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    [RateVisibility.OnRequest, 'On request'],
                    [RateVisibility.Visible, 'Visible'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, defaultRateVisibility: value }))}
                    className={cx(
                      'rounded-xl border px-3 py-2.5 text-left text-sm',
                      draft.defaultRateVisibility === value
                        ? 'border-accent bg-accent/5 font-medium text-ink'
                        : 'border-line text-muted',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={draft.allowForward}
                onChange={(event) =>
                  setDraft((d) => ({ ...d, allowForward: event.target.checked }))
                }
              />
              <span>Buyers can add these designs to their collections</span>
            </label>
          </>
        ) : (
          <p className="text-xs text-muted">
            This group uses your last publish choices for rates and forwarding.
          </p>
        )}

        <ConnectionPicker
          mode="multi"
          embedded
          label="Members"
          loading={connections.isLoading}
          connections={activeConnections}
          value={draft.memberCompanyIds}
          onChange={(ids) => setDraft((d) => ({ ...d, memberCompanyIds: ids }))}
          emptyMessage="Approve a connection first, then add them here."
        />

        <Button
          fullWidth
          disabled={!draft.name.trim() || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending
            ? draft.id
              ? 'Updating…'
              : 'Saving…'
            : draft.id
              ? 'Update group'
              : 'Create group'}
        </Button>
        {allowDelete && draft.id ? (
          <Button
            variant="secondary"
            fullWidth
            disabled={remove.isPending}
            onClick={() => {
              if (!draft.id) return;
              remove.mutate(draft.id);
            }}
          >
            Delete group
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}
