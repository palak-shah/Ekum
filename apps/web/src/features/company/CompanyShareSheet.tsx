import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ConnectionView, MessageView, StartDirectThreadResult } from '@ekum/domain-types';
import { MessageType } from '@ekum/domain-types';
import {
  catalogShareToastLabel,
  dedupeCompanyIds,
  shouldOpenChatAfterCatalogShare,
} from '@/features/browse/catalogShareTargets';
import { api, ApiError } from '@/lib/apiClient';
import { canNativeShare, companyShareCopy, shareMessageText, shareOrCopyInvite } from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, InlineNotice, LoadingBlock, Sheet } from '@/ui/kit';

export function companyProfileShareUrl(origin: string, companyId: string): string {
  return `${origin.replace(/\/$/, '')}/company/${companyId}`;
}

export function companyProfileShareBody(companyName: string, url: string): string {
  return shareMessageText(companyShareCopy(companyName).text, url);
}

/**
 * Share a shop: post name + /company/:id into DMs, or OS share / copy.
 */
export function CompanyShareSheet({
  open,
  onClose,
  companyId,
  companyName,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedCompanyIds([]);
  }, [open]);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open && Boolean(companyId),
  });

  const connectionName = (targetId: string) =>
    connections.data?.find((row) => row.company.id === targetId)?.company.name ?? null;

  const share = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const targets = dedupeCompanyIds(companyIds).filter((id) => id !== companyId);
      if (targets.length === 0) throw new Error('Pick at least one business');
      setError(null);
      const url = companyProfileShareUrl(window.location.origin, companyId);
      const body = companyProfileShareBody(companyName, url);
      const threadIds: string[] = [];
      for (const targetId of targets) {
        const thread = await api.post<StartDirectThreadResult>('/threads/direct', {
          companyId: targetId,
        });
        await api.post<MessageView>(`/threads/${thread.id}/messages`, {
          type: MessageType.Text,
          body,
        });
        threadIds.push(thread.id);
      }
      return {
        threadIds,
        recipientCount: targets.length,
        singleName: targets.length === 1 ? connectionName(targets[0]!) : null,
      };
    },
    onSuccess: ({ threadIds, recipientCount, singleName }) => {
      showToast(catalogShareToastLabel({ recipientCount, singleName }));
      onClose();
      if (shouldOpenChatAfterCatalogShare(recipientCount) && threadIds[0]) {
        navigate(`/chats/${threadIds[0]}`);
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not share.');
    },
  });

  const outside = useMutation({
    mutationFn: async () => {
      setError(null);
      const url = companyProfileShareUrl(window.location.origin, companyId);
      const copy = companyShareCopy(companyName);
      return shareOrCopyInvite({ url, title: copy.title, text: copy.text, preferShareSheet: true });
    },
    onSuccess: (result) => {
      if (result === 'copied') showToast('Link copied');
      onClose();
    },
    onError: (err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Could not share the profile.');
    },
  });

  const selectedCount = selectedCompanyIds.length;
  const busy = share.isPending || outside.isPending;

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!share.isPending) onClose();
      }}
      title="Share profile…"
      footer={
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            fullWidth
            disabled={busy || selectedCount < 1}
            onClick={() => share.mutate(selectedCompanyIds)}
            data-testid="company-share-send"
          >
            {share.isPending
              ? 'Sharing…'
              : selectedCount > 1
                ? `Share with ${selectedCount}`
                : 'Share'}
          </Button>
          <button
            type="button"
            disabled={busy}
            onClick={() => outside.mutate()}
            className="text-center text-sm text-accent disabled:opacity-50"
            data-testid="company-share-outside"
          >
            {outside.isPending
              ? 'Sharing…'
              : canNativeShare()
                ? 'Share outside'
                : 'Copy link'}
          </button>
        </div>
      }
    >
      {error ? <InlineNotice message={error} className="mb-3" /> : null}
      {connections.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="ekum-no-scrollbar flex max-h-[min(24rem,55vh)] flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">{selectedCount} selected · posts into chat</p>
            {selectedCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-accent disabled:opacity-50"
                disabled={busy}
                onClick={() => setSelectedCompanyIds([])}
              >
                Clear
              </button>
            ) : null}
          </div>
          <ConnectionPicker
            mode="multi"
            embedded
            label=""
            connections={(connections.data ?? []).filter((row) => row.company.id !== companyId)}
            value={selectedCompanyIds}
            onChange={setSelectedCompanyIds}
            emptyMessage="No connections yet — find a business below."
            findOnEkum
            onMessageFound={(foundId) => {
              setSelectedCompanyIds((prev) => dedupeCompanyIds([...prev, foundId]));
            }}
          />
        </div>
      )}
    </Sheet>
  );
}
