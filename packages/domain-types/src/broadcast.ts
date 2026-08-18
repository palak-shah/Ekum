import { z } from 'zod';
import { MessageType, messageTypeValues, rateVisibilityValues } from './enums';
import type { PublicCompanySummary } from './access';

/**
 * Buyer groups (BroadcastList): reusable recipient sets for publish audience,
 * share, and broadcast. A broadcast is an immediate multi-recipient share —
 * each recipient receives it independently.
 */

const cardTypes = [MessageType.ProductCard, MessageType.CollectionCard] as const;

export const upsertBroadcastListSchema = z.object({
  name: z.string().trim().min(1).max(120),
  memberCompanyIds: z.array(z.string().min(1)).max(1000).default([]),
  /** Null / omit = inherit company usual rates. */
  defaultRateVisibility: z.enum(rateVisibilityValues).nullable().optional(),
  /** Null / omit = inherit company usual forward. */
  allowForward: z.boolean().nullable().optional(),
});
export type UpsertBroadcastListDto = z.infer<typeof upsertBroadcastListSchema>;

export const sendBroadcastSchema = z
  .object({
    type: z.enum(messageTypeValues).default(MessageType.Text),
    subject: z.string().trim().min(1).max(160),
    body: z.string().trim().max(4000).optional(),
    referenceId: z.string().min(1).optional(),
    recipientCompanyIds: z.array(z.string().min(1)).max(1000).default([]),
    listIds: z.array(z.string().min(1)).max(50).default([]),
  })
  .superRefine((value, ctx) => {
    if ((cardTypes as readonly string[]).includes(value.type) && !value.referenceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A card broadcast needs a referenceId.',
        path: ['referenceId'],
      });
    }
    if (value.recipientCompanyIds.length === 0 && value.listIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pick at least one recipient or list.',
        path: ['recipientCompanyIds'],
      });
    }
  });
export type SendBroadcastDto = z.infer<typeof sendBroadcastSchema>;

export interface BroadcastListView {
  id: string;
  name: string;
  memberCompanyIds: string[];
  memberCount: number;
  /** Null = inherit company usual. */
  defaultRateVisibility: string | null;
  /** Null = inherit company usual. */
  allowForward: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastView {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  referenceId: string | null;
  recipientCount: number;
  recipients: PublicCompanySummary[];
  createdAt: string;
}
