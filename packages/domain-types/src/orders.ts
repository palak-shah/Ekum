import { z } from 'zod';
import { cursorPageQuerySchema } from './common';
import {
  OrderKind,
  orderDirectionValues,
  orderKindValues,
  orderStatusValues,
  returnStatusValues,
  unitValues,
} from './enums';
import type { PublicCompanySummary } from './access';

/**
 * Orders & Fulfillment contracts. There is one Order object shared by two
 * companies, read from a buying or selling perspective. Line items are immutable
 * snapshots taken at order time — a later product edit never rewrites history.
 * Samples, Returns, and Complaints reuse the same vocabulary and party model.
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
    note: z.string().trim().max(1000).optional(),
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
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

/** Dispatch metadata is fulfillment data only — it never gates the state machine. */
export const dispatchSchema = z.object({
  transporter: z.string().trim().max(160).optional(),
  lrNumber: z.string().trim().max(80).optional(),
  parcelCount: z.number().int().positive().max(100000).optional(),
});
export type DispatchDto = z.infer<typeof dispatchSchema>;

/** Seller quote against a requested order — rates land on line snapshots + a rate card in chat. */
export const quoteOrderSchema = z.object({
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        rate: z.number().nonnegative(),
        quantity: z.number().positive().max(1_000_000).optional(),
      }),
    )
    .min(1)
    .max(200),
  note: z.string().trim().max(1000).optional(),
  validUntil: z.string().datetime().optional(),
});
export type QuoteOrderDto = z.infer<typeof quoteOrderSchema>;

export const listOrdersQuerySchema = cursorPageQuerySchema.extend({
  direction: z.enum(orderDirectionValues).optional(),
  status: z.enum(orderStatusValues).optional(),
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
  quantity: number;
  note: string | null;
}

export interface DispatchInfo {
  transporter: string | null;
  lrNumber: string | null;
  parcelCount: number | null;
  dispatchedAt: string | null;
}

export interface OrderView {
  id: string;
  kind: string;
  status: string;
  direction: string;
  note: string | null;
  buyerCompanyId: string;
  sellerCompanyId: string;
  counterpart: PublicCompanySummary;
  items: OrderItemView[];
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
