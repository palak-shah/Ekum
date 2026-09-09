import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type CreateOrdersBatchResult,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { clearBrowseAlbumPick } from '@/features/browse/browseAlbumPick';
import {
  clearBrowseShortlist,
  type BrowseShortlistEntry,
} from '@/features/browse/browseShortlist';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { collectionIdForPackOrder, shouldFallbackPackOrderToBatch } from '@/features/browse/packOrderSource';
import { useToast } from '@/ui/Toast';

function toBatchItems(lines: Array<{ productId: string; quantity: number }>) {
  return lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    images: [],
  }));
}

async function placeFromPackOrBatch(input: {
  intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
  lines: Array<{ productId: string; quantity: number }>;
  collectionId?: string;
  facilitatorCompanyId?: string;
}): Promise<CreateOrdersBatchResult> {
  const batchBody = {
    kind: OrderKind.Standard,
    intent: input.intent,
    facilitatorCompanyId: input.facilitatorCompanyId,
    items: toBatchItems(input.lines),
  };
  if (!input.collectionId) {
    return api.post<CreateOrdersBatchResult>('/orders/batch', batchBody);
  }
  try {
    const payload = await api.post<{
      downstream: CreateOrdersBatchResult['orders'][number];
      failures: CreateOrdersBatchResult['failures'];
    }>('/orders/from-pack', {
      collectionId: input.collectionId,
      kind: OrderKind.Standard,
      intent: input.intent,
      items: toBatchItems(input.lines),
    });
    return {
      orders: payload.downstream ? [payload.downstream] : [],
      failures: payload.failures ?? [],
    };
  } catch (err) {
    if (err instanceof ApiError && shouldFallbackPackOrderToBatch(err.code)) {
      return api.post<CreateOrdersBatchResult>('/orders/batch', batchBody);
    }
    throw err;
  }
}

export function entriesAsProducts(entries: BrowseShortlistEntry[]): ProductView[] {
  return entries.map(
    (entry) =>
      ({
        id: entry.productId,
        name: entry.name,
        images: entry.thumbUrl ? [entry.thumbUrl] : [],
        companyId: entry.companyId,
      }) as ProductView,
  );
}

export function useShortlistOrderFlow() {
  const shortlist = useBrowseShortlist();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [qtyOpen, setQtyOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<CreateOrdersBatchResult | null>(null);
  const [linkedMillCount, setLinkedMillCount] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const batch = useMutation({
    mutationFn: (input: {
      intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
      lines: Array<{ productId: string; quantity: number }>;
      collectionId?: string;
      facilitatorCompanyId?: string;
    }) => {
      return placeFromPackOrBatch(input);
    },
    onSuccess: (payload, variables) => {
      setQtyOpen(false);
      setError(null);
      const failedIds = new Set(payload.failures.flatMap((failure) => failure.productIds));
      const successSellers = new Set(payload.orders.map((order) => order.sellerCompanyId));
      const removeIds = shortlist.entries
        .filter(
          (entry) => successSellers.has(entry.companyId) && !failedIds.has(entry.productId),
        )
        .map((entry) => entry.productId);
      const millsOnPack = new Set(
        shortlist.entries
          .filter((entry) => !failedIds.has(entry.productId))
          .map((entry) => entry.companyId),
      ).size;
      if (variables.collectionId && payload.orders.length === 1 && millsOnPack > 1) {
        setLinkedMillCount(millsOnPack);
      } else {
        setLinkedMillCount(undefined);
      }
      if (payload.orders.length > 0) {
        // Empty Selection after a successful order action (designs + collections).
        clearBrowseShortlist();
        clearBrowseAlbumPick();
      } else if (removeIds.length > 0) {
        shortlist.removeIds(removeIds);
      }
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });

      const inquiry = variables.intent === OrderIntent.Inquiry;
      if (inquiry && payload.orders.length === 1 && payload.failures.length === 0) {
        const order = payload.orders[0]!;
        showToast('Rate request sent');
        if (order.threadId) {
          navigate(`/chats/${order.threadId}`);
          return;
        }
        navigate(`/orders/${order.id}`);
        return;
      }

      setResult(payload);
      setConfirmOpen(true);
    },
    onError: (err, variables) => {
      const inquiry = variables?.intent === OrderIntent.Inquiry;
      setError(
        err instanceof ApiError
          ? err.message
          : inquiry
            ? 'Could not ask for rates.'
            : 'Could not place the order.',
      );
    },
  });

  const sellerIdForQty =
    shortlist.entries.length === 0
      ? 'multi'
      : shortlist.entries.length === 1
        ? shortlist.entries[0]!.companyId
        : shortlist.entries.every((entry) => entry.companyId === shortlist.entries[0]?.companyId)
          ? shortlist.entries[0]!.companyId
          : 'multi';

  return {
    shortlist,
    qtyOpen,
    setQtyOpen,
    confirmOpen,
    setConfirmOpen,
    result,
    linkedMillCount,
    error,
    setError,
    sellerIdForQty,
    products: entriesAsProducts(shortlist.entries),
    submitting: batch.isPending && batch.variables?.intent !== OrderIntent.Inquiry,
    asking: batch.isPending && batch.variables?.intent === OrderIntent.Inquiry,
    sendOrder: (
      lines: Array<{ productId: string; quantity: number }>,
      opts?: { collectionId?: string; facilitatorCompanyId?: string },
    ) => {
      setError(null);
      batch.mutate({
        intent: OrderIntent.Order,
        lines,
        collectionId: opts?.collectionId ?? collectionIdForPackOrder(shortlist.entries),
        facilitatorCompanyId: opts?.facilitatorCompanyId,
      });
    },
    askRates: (
      lines: Array<{ productId: string; quantity: number }>,
      opts?: { collectionId?: string; facilitatorCompanyId?: string },
    ) => {
      setError(null);
      batch.mutate({
        intent: OrderIntent.Inquiry,
        lines,
        collectionId: opts?.collectionId ?? collectionIdForPackOrder(shortlist.entries),
        facilitatorCompanyId: opts?.facilitatorCompanyId,
      });
    },
  };
}
