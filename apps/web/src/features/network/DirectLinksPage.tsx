import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CompanyCard,
  ConnectionView,
  CreateTradeLaneDto,
  ShopFollowerView,
  TradeLaneView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import { PageHeader } from '@/ui/PageHeader';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { PlusIcon, TrashIcon } from '@/ui/icons';
import { Button, EmptyState, LoadingBlock, SearchInput, Sheet } from '@/ui/kit';
import { DirectLinkRevokeCopy } from './DirectLinkRevokeCopy';

function actionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function asPickerConnection(company: CompanyCard): ConnectionView {
  return {
    id: company.id,
    company,
    status: 'active',
    createdAt: new Date(0).toISOString(),
    canPause: false,
    canResume: false,
    canBlock: false,
    canUnblock: false,
  };
}

function LockedOnRow({ label, testId }: { label: string; testId: string }) {
  return (
    <div
      data-testid={testId}
      className="flex w-full items-center justify-between rounded-xl border border-line bg-input px-3 py-2.5 text-left text-sm text-ink"
    >
      <span>{label}</span>
      <span className="shrink-0 text-xs font-emphasis uppercase tracking-wide text-accent">On</span>
    </div>
  );
}

export function PathLockedDefaults({ testIdPrefix }: { testIdPrefix: string }) {
  return (
    <div className="flex flex-col gap-1.5" data-testid={`${testIdPrefix}-defaults`}>
      <LockedOnRow label="Direct supplier orders" testId={`${testIdPrefix}-direct-order`} />
      <LockedOnRow label="Supplier, buyer, and you share a group" testId={`${testIdPrefix}-group`} />
      <LockedOnRow
        label="New supplier posts go to this buyer"
        testId={`${testIdPrefix}-auto-repost`}
      />
    </div>
  );
}

export function DirectLinksPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [millId, setMillId] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const lanes = useQuery({
    queryKey: ['trade-lanes', q],
    queryFn: () =>
      api.get<TradeLaneView[]>('/trade-lanes', q.trim() ? { q: q.trim() } : undefined),
  });

  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<CompanyCard[]>('/follows/following'),
    enabled: createOpen,
  });
  const followers = useQuery({
    queryKey: ['follows', 'followers'],
    queryFn: () => api.get<ShopFollowerView[]>('/follows/followers'),
    enabled: createOpen,
  });

  const create = useMutation({
    mutationFn: (body: CreateTradeLaneDto) => api.post<TradeLaneView>('/trade-lanes', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trade-lanes'] });
      showToast('Saved for next orders.');
      setCreateOpen(false);
      setMillId(null);
      setBuyerId(null);
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not save.'), 'danger'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/trade-lanes/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trade-lanes'] });
      showToast('Direct Link removed. Existing orders stay as they are.');
      setRemoveId(null);
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not remove.'), 'danger'),
  });

  const rows = useMemo(() => lanes.data ?? [], [lanes.data]);
  const millChoices = useMemo(
    () =>
      (following.data ?? [])
        .filter((company) => company.id !== buyerId)
        .map(asPickerConnection),
    [following.data, buyerId],
  );
  const buyerChoices = useMemo(
    () =>
      (followers.data ?? [])
        .filter((row) => !row.stopped && row.company.id !== millId)
        .map((row) => asPickerConnection(row.company)),
    [followers.data, millId],
  );

  return (
    <div className="flex flex-col gap-4 pb-8" data-testid="direct-links-page">
      <PageHeader title="Direct links" />
      <p className="text-sm text-muted">
        Supplier and buyer who should order together. Next orders go to the supplier; you share a
        group.
      </p>

      <ListSearchRow
        search={
          <SearchInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a shop"
            aria-label="Find a shop"
            data-testid="paths-search"
          />
        }
        action={
          <ListSquareButton
            aria-label="New Direct link"
            data-testid="paths-new"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon width={20} height={20} />
          </ListSquareButton>
        }
      />

      {lanes.isLoading ? <LoadingBlock /> : null}
      {!lanes.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No Direct links yet"
          message="Pick a supplier you follow and a buyer who follows you."
        />
      ) : null}

      {rows.length > 0 ? (
        <div
          className="overflow-hidden rounded-2xl border border-line bg-surface"
          data-testid="direct-links-table"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-muted">
            <span className="min-w-0 flex-1">Supplier</span>
            <span className="min-w-0 flex-1">Buyer</span>
            <span className="h-12 w-12 shrink-0" aria-hidden="true" />
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-2 border-b border-line px-4 py-3.5 last:border-b-0"
              data-testid={`path-row-${row.id}`}
            >
              <p className="min-w-0 flex-1 text-sm font-emphasis leading-tight text-ink">
                {row.sellerName}
              </p>
              <p className="min-w-0 flex-1 text-sm leading-tight text-ink">{row.buyerName}</p>
              <button
                type="button"
                className="flex h-12 w-12 shrink-0 items-center justify-center text-danger"
                aria-label="Remove Direct link"
                data-testid={`path-remove-${row.id}`}
                onClick={() => setRemoveId(row.id)}
              >
                <TrashIcon width={20} height={20} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <Sheet
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setMillId(null);
          setBuyerId(null);
        }}
        title="New Direct link"
        footer={
          <Button
            type="button"
            fullWidth
            data-testid="paths-create-save"
            disabled={!millId || !buyerId || millId === buyerId || create.isPending}
            loading={create.isPending}
            onClick={() => {
              if (!millId || !buyerId) return;
              create.mutate({ sellerCompanyId: millId, buyerCompanyId: buyerId });
            }}
          >
            Save for next orders
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-4">
          <ConnectionPicker
            mode="single"
            embedded
            connections={millChoices}
            loading={following.isLoading}
            label="Supplier"
            emptyMessage="Follow a supplier first."
            value={millId}
            onChange={setMillId}
            findOnEkum={false}
          />
          <ConnectionPicker
            mode="single"
            embedded
            connections={buyerChoices}
            loading={followers.isLoading}
            label="Buyer"
            emptyMessage="A buyer needs to follow you first."
            value={buyerId}
            onChange={setBuyerId}
            findOnEkum={false}
          />
          <PathLockedDefaults testIdPrefix="paths-create" />
        </div>
      </Sheet>

      <Sheet
        open={Boolean(removeId)}
        onClose={() => setRemoveId(null)}
        title="Remove Direct link?"
        footer={
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              fullWidth
              variant="secondary"
              onClick={() => setRemoveId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              fullWidth
              data-testid="direct-link-remove-continue"
              disabled={!removeId || remove.isPending}
              loading={remove.isPending}
              onClick={() => {
                if (removeId) remove.mutate(removeId);
              }}
            >
              Continue
            </Button>
          </div>
        }
      >
        <div className="pb-4">
          <DirectLinkRevokeCopy />
        </div>
      </Sheet>
    </div>
  );
}
