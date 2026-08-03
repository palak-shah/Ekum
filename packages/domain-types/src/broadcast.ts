import { z } from 'zod';
import { MessageType, messageTypeValues } from './enums';
import type { PublicCompanySummary } from './access';

/**
 * Broadcast (Phase 1): compose once and send now to selected buyers and/or saved
 * lists. Scheduling and audience tiering are deferred to Phase 2. A broadcast is
 * an immediate multi-recipient share — each recipient receives it independently.
 */

const cardTypes = [MessageType.ProductCard, MessageType.CollectionCard] as const;

export const upsertBroadcastListSchema = z.object({
  name: z.string().trim().min(1).max(120),
  memberCompanyIds: z.array(z.string().min(1)).max(1000).default([]),
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
