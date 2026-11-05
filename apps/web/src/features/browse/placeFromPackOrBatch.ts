import {
  OrderIntent,
  OrderKind,
  type CreateOrdersBatchResult,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { shouldFallbackPackOrderToBatch } from '@/features/browse/packOrderSource';
import {
  placeNoteAttachFields,
  type PlaceNoteAttach,
} from '@/features/orders/placeNoteAttach';

function toBatchItems(lines: Array<{ productId: string; quantity: number; note?: string }>) {
  return lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    images: [],
    ...(line.note?.trim() ? { note: line.note.trim() } : {}),
  }));
}

export type PlaceFromPackOrBatchInput = PlaceNoteAttach & {
  intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
  lines: Array<{ productId: string; quantity: number; note?: string }>;
  collectionId?: string;
  facilitatorCompanyId?: string;
  transporter?: string;
};

/** Curated pack → from-pack. No pack id, or NOT_CURATED → normal batch. */
export async function placeFromPackOrBatch(
  input: PlaceFromPackOrBatchInput,
): Promise<CreateOrdersBatchResult> {
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
