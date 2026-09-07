import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BroadcastListView,
  CompanySettingsView,
  ConnectionView,
  PublishCollectionDto,
} from '@ekum/domain-types';
import { PublishAudience } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { Button, Sheet } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import { resolveOrderPathPreference } from '@/features/browse/orderPathPreference';
import { readCompanyPublishDefaults } from './publishDefaults';
import {
  emptyPublishAudienceState,
  publishAudienceCanSubmit,
  publishAudienceDtoFields,
  PublishAudienceFields,
  selectCreatedGroup,
  type PublishAudienceState,
} from './PublishAudienceFields';

type Props = {
  open: boolean;
  onClose: () => void;
  collectionIds: string[];
  onDone: () => void;
};

export function BulkCollectionPublishSheet({ open, onClose, collectionIds, onDone }: Props) {
  const company = useMyCompany();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canPublishAlready = Boolean(company.data?.capabilities.publish);

  const [publishAudience, setPublishAudience] = useState<PublishAudienceState>(() =>
    emptyPublishAudienceState(),
  );
  const [consent, setConsent] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open,
  });
  const broadcastLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled: open && publishAudience.audience === PublishAudience.Selected,
  });
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: open,
  });

  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');

  useEffect(() => {
    if (!open || !settings.data) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    const orderPath = resolveOrderPathPreference(settings.data.tradeDefaults);
    setPublishAudience((prev) => ({
      ...emptyPublishAudienceState(usual, orderPath),
      audience: prev.audience || PublishAudience.Followers,
    }));
    setConsent(false);
    setError(null);
  }, [open, settings.data]);

  const canSubmit =
    collectionIds.length > 0 &&
    (canPublishAlready || consent) &&
    publishAudienceCanSubmit(publishAudience);

  const publish = useMutation({
    mutationFn: async () => {
      const dto: PublishCollectionDto = {
        audience: publishAudience.audience as PublishCollectionDto['audience'],
        rateVisibility: publishAudience.rateVisibility as PublishCollectionDto['rateVisibility'],
        allowForward: publishAudience.allowForward,
        orderPathPreference: publishAudience.orderPathPreference,
        ...publishAudienceDtoFields(publishAudience),
        ...(canPublishAlready ? {} : { consentToSell: true }),
      };
      const results = await Promise.allSettled(
        collectionIds.map((id) => api.post(`/collections/${id}/publish`, dto)),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const ok = results.length - failed;
      return { ok, failed };
    },
    onSuccess: ({ ok, failed }) => {
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      if (failed === 0) {
        showToast(
          !publishAudience.allowForward
            ? `Published ${ok} · Buyers can’t forward these.`
            : `Published ${ok} collection${ok === 1 ? '' : 's'}`,
        );
      } else {
        showToast(`Published ${ok}, ${failed} failed`, 'danger');
      }
      onDone();
      onClose();
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not publish.';
      setError(message);
      showToast(message, 'danger');
    },
  });

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={`Publish ${collectionIds.length} collection${collectionIds.length === 1 ? '' : 's'}`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Same visibility for all selected. Empty packs are skipped by the server.
          </p>

          <PublishAudienceFields
            state={publishAudience}
            onChange={setPublishAudience}
            lists={broadcastLists.data ?? []}
            connections={activeConnections}
            connectionsLoading={connections.isLoading}
            tradeDefaults={settings.data?.tradeDefaults}
            showConsent={!canPublishAlready}
            consent={consent}
            onConsent={setConsent}
            consentLabel="Start selling — publish these collections?"
            onCreateGroup={() => setCreateGroupOpen(true)}
          />

          {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

          <Button
            fullWidth
            disabled={!canSubmit || publish.isPending}
            onClick={() => {
              setError(null);
              publish.mutate();
            }}
          >
            {publish.isPending ? 'Publishing…' : `Publish ${collectionIds.length}`}
          </Button>
        </div>
      </Sheet>

      <BuyerGroupFormSheet
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSaved={(list) => {
          setPublishAudience((prev) =>
            selectCreatedGroup(
              prev,
              list,
              broadcastLists.data ?? [],
              settings.data?.tradeDefaults,
            ),
          );
          void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
        }}
      />
    </>
  );
}
