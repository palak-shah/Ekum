import { z } from 'zod';
import { cursorPageQuerySchema } from './common';
import {
  OrderIntent,
  OrderKind,
  type OrderLineStatus,
  orderDirectionValues,
  orderIntentValues,
  orderKindValues,
  orderStatusValues,
  returnStatusValues,
  unitValues,
} from './enums';
import type { PublicCompanySummary } from './access';
import type { AuditActorView } from './catalog';

/**
 * Orders & Fulfillment contracts. There is one Order object shared by two
 * companies, read from a buying or selling perspective. Line items are snapshots
 * taken at order time — product edits never rewrite history. Quantity/rate may
 * change via seller quote; lineStatus tracks partial outcomes. Samples, Returns,
 * and Complaints reuse the same vocabulary and party model.
 */

const quantity = z.number().positive().max(1_000_000);

export const orderItemInputSchema = z.object({
  productId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  images: z.array(z.string().url()).max(12).default([]),
  unit: z.enum(unitValues).optional(),
  quantity,
  note: z.string().trim().max(500).optional(),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const createOrderSchema = z
  .object({
    sellerCompanyId: z.string().min(1),
    kind: z.enum(orderKindValues).default(OrderKind.Standard),
    /** Soft rate ask vs firm place-order. Default order. */
    intent: z.enum(orderIntentValues).default(OrderIntent.Order),
    note: z.string().trim().max(1000).optional(),
    /** Direct mode: keep this company informed (must have trading on). */
    facilitatorCompanyId: z.string().min(1).optional(),
    /** I handle: buyer ticket is with seller; foreign designs allowed + upstream. */
    orderPathPreference: z.enum(['direct', 'handle']).optional(),
    items: z.array(orderItemInputSchema).min(1).max(200),
  })
  .superRefine((value, ctx) => {
    value.items.forEach((item, index) => {
      if (value.kind === OrderKind.Standard && !item.productId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each standard order line needs a productId.',
          path: ['items', index, 'productId'],
        });
      }
      if (value.kind === OrderKind.Photo && item.images.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each photo order line needs at least one image.',
          path: ['items', index, 'images'],
        });
      }
    });
  });
/** Wire input — `kind` / `intent` default when omitted. */
export type CreateOrderDto = z.input<typeof createOrderSchema>;

/** Multi-supplier place/ask — server groups lines by product owner. */
export const createOrdersBatchSchema = z.object({
  kind: z.enum(orderKindValues).default(OrderKind.Standard),
  intent: z.enum(orderIntentValues).default(OrderIntent.Order),
  note: z.string().trim().max(1000).optional(),
  /** Direct mode: keep this company informed (must have trading on). */
  facilitatorCompanyId: z.string().min(1).optional(),
  items: z
    .array(
      orderItemInputSchema.extend({
        productId: z.string().min(1),
      }),
    )
    .min(1)
    .max(200),
});
export type CreateOrdersBatchDto = z.input<typeof createOrdersBatchSchema>;

/** Manage place from a curated pack (seller = pack owner). */
export const createOrdersFromPackSchema = z.object({
  collectionId: z.string().min(1),
  kind: z.enum(orderKindValues).default(OrderKind.Standard),
  intent: z.enum(orderIntentValues).default(OrderIntent.Order),
  note: z.string().trim().max(1000).optional(),
  items: z
    .array(
      orderItemInputSchema.extend({
        productId: z.string().min(1),
      }),
    )
    .min(1)
    .max(200),
});
export type CreateOrdersFromPackDto = z.input<typeof createOrdersFromPackSchema>;

export interface CreateOrdersFromPackResult {
  downstream: OrderView;
  upstreams: OrderView[];
  failures: CreateOrdersBatchFailure[];
}

export interface CreateOrdersBatchFailure {
  sellerCompanyId: string;
  sellerName: string | null;
  productIds: string[];
  code: string;
  message: string;
}

export interface CreateOrdersBatchResult {
  orders: OrderView[];
  failures: CreateOrdersBatchFailure[];
}

/** Buyer amends catalog lines before any seller quote/confirm/decline. */
export const amendOrderSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  items: z
    .array(
      orderItemInputSchema.extend({
        productId: z.string().min(1),
      }),
    )
    .min(1)
    .max(200),
});
export type AmendOrderDto = z.infer<typeof amendOrderSchema>;

/** Dispatch: omit items to ship all remaining confirmed qty; provide for partial. LR required. */
export const dispatchSchema = z.object({
  transporter: z.string().trim().max(160).optional(),
  lrNumber: z.string().trim().min(1).max(80),
  parcelCount: z.number().int().positive().max(100000).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        quantity,
      }),
    )
    .min(1)
    .max(200)
    .optional(),
});
export type DispatchDto = z.infer<typeof dispatchSchema>;

/**
 * Seller quote. Included lines need a rate; mark unavailable to decline a line.
 * At least one supplyable (not unavailable) line is required.
 */
export const quoteOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          orderItemId: z.string().min(1),
          unavailable: z.boolean().optional(),
          rate: z.number().nonnegative().optional(),
          quantity: z.number().positive().max(1_000_000).optional(),
        }),
      )
      .min(1)
      .max(200),
    note: z.string().trim().max(1000).optional(),
    validUntil: z.string().datetime().optional(),
  })
  .superRefine((value, ctx) => {
    let supplyable = 0;
    value.items.forEach((line, index) => {
      if (line.unavailable) {
        return;
      }
      supplyable += 1;
      if (line.rate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Rate is required for lines you can supply.',
          path: ['items', index, 'rate'],
        });
      }
    });
    if (supplyable < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quote at least one design, or decline the whole order.',
        path: ['items'],
      });
    }
  });
export type QuoteOrderDto = z.infer<typeof quoteOrderSchema>;

/** Seller decides open lines without a rate quote (confirm / decline mix). */
export const decideOrderLinesSchema = z.object({
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        action: z.enum(['confirm', 'decline']),
        quantity: z.number().positive().max(1_000_000).optional(),
      }),
    )
    .min(1)
    .max(200),
  note: z.string().trim().max(1000).optional(),
});
export type DecideOrderLinesDto = z.infer<typeof decideOrderLinesSchema>;

export const listOrdersQuerySchema = cursorPageQuerySchema.extend({
  direction: z.enum(orderDirectionValues).optional(),
  status: z.enum(orderStatusValues).optional(),
  sort: z.enum(['newest', 'oldest']).optional().default('newest'),
  createdFrom: z.string().min(1).max(40).optional(),
  createdTo: z.string().min(1).max(40).optional(),
  q: z.string().trim().min(1).max(80).optional(),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const listReturnsQuerySchema = cursorPageQuerySchema.extend({
  direction: z.enum(orderDirectionValues).optional(),
  status: z.enum(returnStatusValues).optional(),
});
export type ListReturnsQuery = z.infer<typeof listReturnsQuerySchema>;

// --- Samples ----------------------------------------------------------------

export const createSampleSchema = z.object({
  sellerCompanyId: z.string().min(1),
  productId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(200),
  note: z.string().trim().max(500).optional(),
});
export type CreateSampleDto = z.infer<typeof createSampleSchema>;

export const sampleDispatchSchema = z.object({
  transporter: z.string().trim().max(160).optional(),
  lrNumber: z.string().trim().max(80).optional(),
});
export type SampleDispatchDto = z.infer<typeof sampleDispatchSchema>;

// --- Returns ----------------------------------------------------------------

export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().max(1000).optional(),
  items: z
    .array(z.object({ orderItemId: z.string().min(1), quantity }))
    .min(1)
    .max(200),
});
export type CreateReturnDto = z.infer<typeof createReturnSchema>;

export const approveReturnSchema = z
  .object({
    // Omit to approve every requested quantity in full; provide to approve partially.
    items: z
      .array(
        z.object({ returnItemId: z.string().min(1), approvedQuantity: z.number().nonnegative() }),
      )
      .max(200)
      .optional(),
  })
  .default({});
export type ApproveReturnDto = z.infer<typeof approveReturnSchema>;

export const escalateReturnSchema = z.object({
  upstreamOrderId: z.string().min(1),
  reason: z.string().trim().max(1000).optional(),
});
export type EscalateReturnDto = z.infer<typeof escalateReturnSchema>;

// --- Complaints -------------------------------------------------------------

export const createComplaintSchema = z.object({
  orderId: z.string().min(1),
  subject: z.string().trim().min(1).max(160),
  detail: z.string().trim().max(2000).optional(),
});
export type CreateComplaintDto = z.infer<typeof createComplaintSchema>;

export const respondComplaintSchema = z.object({
  response: z.string().trim().min(1).max(2000),
});
export type RespondComplaintDto = z.infer<typeof respondComplaintSchema>;

// --- View models ------------------------------------------------------------

export interface OrderItemView {
  id: string;
  productId: string | null;
  name: string;
  sku: string | null;
  rate: number | null;
  unit: string | null;
  image: string | null;
  images: string[];
  /** Current agreed / offered quantity. */
  quantity: number;
  /** Original buyer-requested quantity. */
  requestedQuantity: number;
  lineStatus: OrderLineStatus;
  /** Qty already included in shipments. */
  shippedQuantity: number;
  /** quantity − shippedQuantity for shippable lines. */
  remainingQuantity: number;
  note: string | null;
}

export interface DispatchInfo {
  transporter: string | null;
  lrNumber: string | null;
  parcelCount: number | null;
  dispatchedAt: string | null;
}

export interface OrderShipmentItemView {
  orderItemId: string;
  name: string;
  quantity: number;
}

export interface OrderShipmentView {
  id: string;
  transporter: string | null;
  lrNumber: string | null;
  parcelCount: number | null;
  dispatchedAt: string;
  items: OrderShipmentItemView[];
}

export interface OrderRelatedOrderView {
  id: string;
  role: 'downstream' | 'upstream';
  status: string;
  /** Null when soft-hide applies for the viewer. */
  sellerName: string | null;
  buyerName: string | null;
}

export interface OrderView {
  id: string;
  kind: string;
  /** order | inquiry — inquiry is a rate ask until quoted/confirmed. */
  intent: string;
  status: string;
  /** bilateral | manage | direct */
  tradeMode: string;
  facilitatorCompanyId: string | null;
  downstreamOrderId: string | null;
  /** Linked dual-trade orders; names may be null under soft-hide. */
  relatedOrders: OrderRelatedOrderView[];
  /** Facilitator may Take control (direct, requested, no seller quote). */
  canTakeControl?: boolean;
  direction: string;
  /** Times the buyer amended before seller progress. */
  amendCount: number;
  /**
   * Live: buyer may still amend lines (requested, all open, no seller response).
   * Omitted/false on list payloads when not computed.
   */
  canAmend?: boolean;
  /**
   * Live: buyer may accept — seller has sent a Rate quote (catalog line rates alone do not count).
   */
  canAcceptQuote?: boolean;
  /** Live: seller has posted at least one Rate card for this order. */
  hasSellerQuote?: boolean;
  note: string | null;
  buyerCompanyId: string;
  sellerCompanyId: string;
  counterpart: PublicCompanySummary;
  items: OrderItemView[];
  shipments: OrderShipmentView[];
  /** Latest shipment summary when any exist (compat with older UI). */
  dispatch: DispatchInfo | null;
  /** Direct thread where the order/quote cards live, when found. */
  threadId: string | null;
  confirmedAt: string | null;
  /** Display name of who confirmed (seller or buyer), when known. */
  confirmedByName: string | null;
  /** buyer | seller | null — role of who confirmed, from the order parties. */
  confirmedByRole: 'buyer' | 'seller' | null;
  buyerName: string;
  sellerName: string;
  deliveredAt: string | null;
  /** Set when cancelled, declined, or return window closed. */
  closedAt: string | null;
  /** True when some but not all shippable qty has left. */
  partiallyShipped: boolean;
  /** Returns on this order (detail payload; list may send []). */
  returns: ReturnView[];
  createdBy: AuditActorView | null;
  updatedBy: AuditActorView | null;
  createdAt: string;
  updatedAt: string;
}

export interface SampleView {
  id: string;
  status: string;
  direction: string;
  productId: string | null;
  name: string;
  note: string | null;
  buyerCompanyId: string;
  sellerCompanyId: string;
  counterpart: PublicCompanySummary;
  dispatch: DispatchInfo | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItemView {
  id: string;
  orderItemId: string;
  name: string;
  requestedQuantity: number;
  approvedQuantity: number | null;
}

export interface ReturnView {
  id: string;
  orderId: string;
  status: string;
  reason: string | null;
  direction: string;
  counterpart: PublicCompanySummary;
  items: ReturnItemView[];
  escalatedFromReturnId: string | null;
  decidedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintView {
  id: string;
  orderId: string;
  status: string;
  subject: string;
  detail: string | null;
  response: string | null;
  raisedByCompanyId: string;
  againstCompanyId: string;
  mine: boolean;
  createdAt: string;
  updatedAt: string;
}
