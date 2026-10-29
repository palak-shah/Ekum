import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type CreateOrdersBatchResult,
  type OrderView,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { clearBrowseCart } from '@/features/browse/browseCart';
import { clearSelection } from '@/features/browse/clearSelection';
import { type BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { collectionIdForPackOrder, shouldFallbackPackOrderToBatch } from '@/features/browse/packOrderSource';
import {
  isDirectPackLine,
  packPlaceGoesToSellerId,
  packPlaceWaveEntries,
  type PackPlaceLine,
} from '@/features/browse/packPlacePhases';
import { batchConfirmTitle, batchSuccessLeave } from '@/features/orders/BatchOrderConfirmSheet';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import {
  placeNoteAttachFields,
  type PlaceNoteAttach,
} from '@/features/orders/placeNoteAttach';
import { useToast } from '@/ui/Toast';

function toBatchItems(lines: Array<{ productId: string; quantity: number; note?: string }>) {
  return lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    images: [],
    ...(line.note?.trim() ? { note: line.note.trim() } : {}),
  }));
}

type PlaceFlowOpts = PlaceNoteAttach & {
  collectionId?: string;
  facilitatorCompanyId?: string;
  transporter?: string;
};

async function placeFromPackOrBatch(input: {
  intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
  lines: Array<{ productId: string; quantity: number; note?: string }>;
  collectionId?: string;
  facilitatorCompanyId?: string;
  transporter?: string;
} & PlaceNoteAttach): Promise<CreateOrdersBatchResult> {
  const attach = placeNoteAttachFields(input);
  const batchBody = {
    kind: OrderKind.Standard,
    intent: input.intent,
    facilitatorCompanyId: input.facilitatorCompanyId,
    ...(input.transporter ? { transporter: input.transporter } : {}),
    ...attach,
    items: toBatchItems(input.lines),
  };
  if (!input.collectionId) {
    return api.post<CreateOrdersBatchResult>('/orders/batch', batchBody);
  }
  try {
    const payload = await api.post<{
      downstream: CreateOrdersBatchResult['orders'][number] | null;
      directs?: CreateOrdersBatchResult['orders'];
      failures: CreateOrdersBatchResult['failures'];
    }>('/orders/from-pack', {
      collectionId: input.collectionId,
      kind: OrderKind.Standard,
      intent: input.intent,
      ...(input.transporter ? { transporter: input.transporter } : {}),
      ...attach,
      items: toBatchItems(input.lines),
    });
    return {
      orders: [
        ...(payload.downstream ? [payload.downstream] : []),
        ...(payload.directs ?? []),
      ],
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
        companyName: entry.companyName,
        categories: entry.categories ?? [],
        unit: entry.unit ?? null,
        dispatchUnit: entry.dispatchUnit ?? null,
        piecesPerPack: entry.piecesPerPack ?? null,
        moq: entry.moq ?? null,
        rate: entry.rate ?? null,
        rateMax: entry.rateMax ?? null,
        catalogCollectionId: entry.catalogCollectionId ?? null,
        catalogOrderMode: entry.catalogOrderMode ?? null,
        catalogRateUnit: entry.catalogRateUnit ?? null,
        ...(entry.catalogWhole
          ? { catalogWhole: true, catalogName: entry.catalogName ?? null }
          : {}),
      }) as ProductView,
  );
}

export function sellerIdForEntries(entries: readonly { companyId: string }[]): string {
  if (entries.length === 0) return 'multi';
  const first = entries[0]!.companyId;
  return entries.every((entry) => entry.companyId === first) ? first : 'multi';
}

/** Who How many Place goes to: Direct mill on sheet 1, pack owner on I-handle. */
export function orderGoesToSellerId(
  entries: readonly PackPlaceLine[],
): string {
  return packPlaceGoesToSellerId([...entries]);
}

export function useShortlistOrderFlow(options?: {
  /** Cart page only — staging Order must leave a parked cart alone. */
  clearCartOnSuccess?: boolean;
}) {
  const clearCartOnSuccess = options?.clearCartOnSuccess === true;
  const shortlist = useBrowseShortlist();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [qtyOpen, setQtyOpenState] = useState(false);
  const [qtyJob, setQtyJob] = useState<'order' | 'ask'>('order');
  const [error, setError] = useState<string | null>(null);
  const [placedProductIds, setPlacedProductIds] = useState<string[]>([]);
  const placedIdsRef = useRef<string[]>([]);
  const firstDirectRef = useRef<OrderView | null>(null);

  const resetPlaceWaves = () => {
    placedIdsRef.current = [];
    firstDirectRef.current = null;
    setPlacedProductIds([]);
  };

  const setQtyOpen = (open: boolean) => {
    if (open && !qtyOpen) resetPlaceWaves();
    if (!open) resetPlaceWaves();
    setQtyOpenState(open);
  };

  const remainingEntries = <T extends PackPlaceLine>(entries: T[]): T[] => {
    const placed = new Set(placedProductIds);
    return entries.filter((entry) => !entry.productId || !placed.has(entry.productId));
  };

  const waveEntries = <T extends PackPlaceLine>(entries: T[]): T[] => {
    return packPlaceWaveEntries(remainingEntries(entries));
  };

  const openQty = (job: 'order' | 'ask' = 'order') => {
    setError(null);
    setQtyJob(job);
    setQtyOpen(true);
  };

  const finishPlace = (
    payload: CreateOrdersBatchResult,
    variables: { collectionId?: string; intent: string },
  ) => {
    const landDirect = firstDirectRef.current;
    setQtyOpenState(false);
    resetPlaceWaves();
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
    const linkedMillCount =
      variables.collectionId && payload.orders.length === 1 && millsOnPack > 1
        ? millsOnPack
        : undefined;
    if (payload.orders.length > 0 || landDirect) {
      clearSelection();
      if (clearCartOnSuccess) clearBrowseCart();
    } else if (removeIds.length > 0) {
      shortlist.removeIds(removeIds);
    }
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });

    const title = batchConfirmTitle(payload, { linkedMillCount });
    const tone = payload.orders.length === 0 && !landDirect ? 'danger' : 'success';
    const leaveOrder = landDirect ?? batchSuccessLeave(payload)?.order ?? null;
    showToast(title, tone);
    if (leaveOrder) {
      void navigateToOrderChat(navigate, queryClient, leaveOrder, { replace: true });
    }
  };

  const batch = useMutation({
    mutationFn: (input: {
      intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
      lines: Array<{ productId: string; quantity: number; note?: string }>;
    } & PlaceFlowOpts) => {
      return placeFromPackOrBatch(input);
    },
    onSuccess: (payload, variables) => {
      const failedIds = new Set(payload.failures.flatMap((failure) => failure.productIds));
      const submittedIds = variables.lines.map((line) => line.productId);
      const succeededIds = submittedIds.filter((id) => !failedIds.has(id));
      const wasDirectWave =
        variables.intent === OrderIntent.Order &&
        succeededIds.length > 0 &&
        succeededIds.every((id) => {
          const entry = shortlist.entries.find((row) => row.productId === id);
          return Boolean(entry && isDirectPackLine(entry));
        });
      const nextPlaced = [...placedIdsRef.current, ...succeededIds];
      const remaining = shortlist.entries.filter(
        (entry) => !nextPlaced.includes(entry.productId) && !failedIds.has(entry.productId),
      );
      const handleLeft = remaining.filter((entry) => !isDirectPackLine(entry));
      const moreHandle =
        wasDirectWave && handleLeft.length > 0 && payload.orders.length > 0;

      if (moreHandle) {
        placedIdsRef.current = nextPlaced;
        setPlacedProductIds(nextPlaced);
        if (!firstDirectRef.current && payload.orders[0]) {
          firstDirectRef.current = payload.orders[0];
        }
        shortlist.removeIds(succeededIds);
        setError(null);
        void queryClient.invalidateQueries({ queryKey: ['orders'] });
        void queryClient.invalidateQueries({ queryKey: ['threads'] });
        const title = batchConfirmTitle(payload);
        showToast(title, payload.orders.length === 0 ? 'danger' : 'success');
        return;
      }

      finishPlace(payload, variables);
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

  const sellerIdForQty = sellerIdForEntries(waveEntries(shortlist.entries));

  return {
    shortlist,
    qtyOpen,
    setQtyOpen,
    qtyJob,
    openQty,
    error,
    setError,
    sellerIdForQty,
    placedProductIds,
    remainingEntries,
    waveEntries,
    products: entriesAsProducts(waveEntries(shortlist.entries)),
    submitting: batch.isPending && batch.variables?.intent !== OrderIntent.Inquiry,
    asking: batch.isPending && batch.variables?.intent === OrderIntent.Inquiry,
    sendOrder: (
      lines: Array<{ productId: string; quantity: number; note?: string }>,
      opts?: PlaceFlowOpts,
    ) => {
      setError(null);
      const attach = placeNoteAttachFields(opts);
      batch.mutate({
        intent: OrderIntent.Order,
        lines,
        collectionId: opts?.collectionId ?? collectionIdForPackOrder(shortlist.entries),
        facilitatorCompanyId: opts?.facilitatorCompanyId,
        transporter: opts?.transporter,
        ...attach,
      });
    },
    askRates: (
      lines: Array<{ productId: string; quantity: number; note?: string }>,
      opts?: PlaceFlowOpts,
    ) => {
      setError(null);
      const attach = placeNoteAttachFields(opts);
      batch.mutate({
        intent: OrderIntent.Inquiry,
        lines,
        collectionId: opts?.collectionId ?? collectionIdForPackOrder(shortlist.entries),
        facilitatorCompanyId: opts?.facilitatorCompanyId,
        transporter: opts?.transporter,
        ...attach,
      });
    },
  };
}
