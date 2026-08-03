import { z } from 'zod';
import { cursorPageQuerySchema } from './common';
import {
  MessageType,
  messageTypeValues,
  threadAlertLevelValues,
  threadParticipantStateValues,
  threadVisibilityValues,
  ThreadVisibility,
} from './enums';
import type { PublicCompanySummary } from './access';

/**
 * Conversation contracts. Threads are between companies (direct or group).
 * Messages reference trade objects (product / collection / order) by id — never
 * a copy — so a shared card always resolves to the live, permission-checked
 * object. A first message from an unconnected company opens as a request.
 */

const cardTypes = [MessageType.ProductCard, MessageType.CollectionCard, MessageType.OrderCard] as const;

export const startDirectThreadSchema = z.object({
  companyId: z.string().min(1),
  visibility: z.enum(threadVisibilityValues).default(ThreadVisibility.Shared),
});
export type StartDirectThreadDto = z.infer<typeof startDirectThreadSchema>;

export const createGroupThreadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  participantCompanyIds: z.array(z.string().min(1)).min(1).max(50),
  visibility: z.enum(threadVisibilityValues).default(ThreadVisibility.Shared),
});
export type CreateGroupThreadDto = z.infer<typeof createGroupThreadSchema>;

export const sendMessageSchema = z
  .object({
    type: z.enum(messageTypeValues).default(MessageType.Text),
    body: z.string().trim().min(1).max(4000).optional(),
    referenceId: z.string().min(1).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === MessageType.Text && !value.body) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A text message needs a body.', path: ['body'] });
    }
    if ((cardTypes as readonly string[]).includes(value.type) && !value.referenceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A card message needs a referenceId.',
        path: ['referenceId'],
      });
    }
  });
export type SendMessageDto = z.infer<typeof sendMessageSchema>;

export const listThreadsQuerySchema = cursorPageQuerySchema.extend({
  state: z.enum(threadParticipantStateValues).optional(),
});
export type ListThreadsQuery = z.infer<typeof listThreadsQuerySchema>;

export const setAlertLevelSchema = z.object({
  alertLevel: z.enum(threadAlertLevelValues),
});
export type SetAlertLevelDto = z.infer<typeof setAlertLevelSchema>;

export const addParticipantsSchema = z.object({
  companyIds: z.array(z.string().min(1)).min(1).max(50),
});
export type AddParticipantsDto = z.infer<typeof addParticipantsSchema>;

// --- View models ------------------------------------------------------------

export interface MessageReference {
  kind: 'product' | 'collection' | 'order' | 'rate';
  id: string;
  name: string | null;
  image: string | null;
  available: boolean;
  /** Order/rate cards: compact status + item count for chat rendering. */
  status?: string | null;
  itemCount?: number | null;
  totalLabel?: string | null;
}

export interface MessageView {
  id: string;
  threadId: string;
  senderCompanyId: string;
  type: string;
  body: string | null;
  reference: MessageReference | null;
  metadata: unknown;
  createdAt: string;
  mine: boolean;
}

export interface ParticipantView {
  companyId: string;
  company: PublicCompanySummary;
  state: string;
  alertLevel: string;
  lastReadAt: string | null;
}

export interface ThreadSummary {
  id: string;
  type: string;
  visibility: string;
  title: string | null;
  state: string;
  alertLevel: string;
  unreadCount: number;
  lastMessage: MessageView | null;
  lastMessageAt: string;
  counterpart: PublicCompanySummary | null;
  participantCount: number;
}

export interface ThreadDetail extends ThreadSummary {
  participants: ParticipantView[];
}
