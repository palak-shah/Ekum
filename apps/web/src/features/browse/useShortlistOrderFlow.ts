import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type CreateOrdersBatchResult,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';

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
  const [qtyOpen, setQtyOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<CreateOrdersBatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const batch = useMutation({
    mutationFn: (input: {
      intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
      lines: Array<{ productId: string; quantity: number }>;
    }) =>
      api.post<CreateOrdersBatchResult>('/orders/batch', {
        kind: OrderKind.Standard,
        intent: input.intent,
        items: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
        })),
      }),
    onSuccess: (payload) => {
      setQtyOpen(false);
      setError(null);
      const failedIds = new Set(payload.failures.flatMap((failure) => failure.productIds));
      const successSellers = new Set(payload.orders.map((order) => order.sellerCompanyId));
      const removeIds = shortlist.entries
        .filter(
          (entry) => successSellers.has(entry.companyId) && !failedIds.has(entry.productId),
        )
        .map((entry) => entry.productId);
      if (removeIds.length > 0) shortlist.removeIds(removeIds);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      setResult(payload);
      setConfirmOpen(true);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not place the order.');
    },
  });

  const sellerIdForQty =
    shortlist.entries.length === 1
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
    error,
    setError,
    sellerIdForQty,
    products: entriesAsProducts(shortlist.entries),
    submitting: batch.isPending && batch.variables?.intent !== OrderIntent.Inquiry,
    asking: batch.isPending && batch.variables?.intent === OrderIntent.Inquiry,
    sendOrder: (lines: Array<{ productId: string; quantity: number }>) => {
      setError(null);
      batch.mutate({ intent: OrderIntent.Order, lines });
    },
    askRates: (lines: Array<{ productId: string; quantity: number }>) => {
      setError(null);
      batch.mutate({ intent: OrderIntent.Inquiry, lines });
    },
  };
}
