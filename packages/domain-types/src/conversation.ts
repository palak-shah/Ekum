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
const needsBodyTypes = [MessageType.Text, MessageType.Photo] as const;

/** Photo album: ordered blob URL references (no image bytes in chat). */
export const photoMessageMetadataSchema = z.object({
  urls: z.array(z.string().trim().min(1)).min(1),
});
export type PhotoMessageMetadata = z.infer<typeof photoMessageMetadataSchema>;

/** Resolve album URLs from metadata, falling back to a legacy single-body photo. */
export function photoUrlsFromMessage(message: {
  body: string | null | undefined;
  metadata: unknown;
}): string[] {
  const parsed = photoMessageMetadataSchema.safeParse(message.metadata);
  if (parsed.success) {
    return parsed.data.urls;
  }
  const body = message.body?.trim();
  return body ? [body] : [];
}

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
    replyToMessageId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if ((needsBodyTypes as readonly string[]).includes(value.type) && !value.body) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          value.type === MessageType.Photo
            ? 'A photo message needs an image URL.'
            : 'A text message needs a body.',
        path: ['body'],
      });
    }
    if ((cardTypes as readonly string[]).includes(value.type) && !value.referenceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A card message needs a referenceId.',
        path: ['referenceId'],
      });
    }
    if (
      value.type === MessageType.Photo &&
      value.metadata &&
      Object.prototype.hasOwnProperty.call(value.metadata, 'urls')
    ) {
      const parsed = photoMessageMetadataSchema.safeParse(value.metadata);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Photo metadata.urls must be a non-empty list of image URLs.',
          path: ['metadata', 'urls'],
        });
      } else if (value.body && value.body !== parsed.data.urls[0]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Photo body must match the first URL in metadata.urls.',
          path: ['body'],
        });
      }
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

export const setThreadPinnedSchema = z.object({
  pinned: z.boolean(),
});
export type SetThreadPinnedDto = z.infer<typeof setThreadPinnedSchema>;

/** Max chats a company may pin (private to that company). */
export const MAX_PINNED_THREADS = 8;

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
  /**
   * Preview images for WhatsApp-style grids in chat.
   * Collection: first design thumbs. Product: product photos.
   */
  images?: string[] | null;
  available: boolean;
  /** Order/rate: line count. Collection: total designs (for +N overflow). */
  status?: string | null;
  itemCount?: number | null;
  totalLabel?: string | null;
  /** Other party on the order, from the viewer's perspective. */
  counterpartName?: string | null;
  /** Viewer role on this order: buying | selling. */
  direction?: 'buying' | 'selling' | null;
  buyerName?: string | null;
  sellerName?: string | null;
  /** Who moved the order to confirmed, when known. */
  confirmedByName?: string | null;
}

export interface MessageReplyPreview {
  id: string;
  type: string;
  bodyPreview: string | null;
  available: boolean;
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
  replyTo: MessageReplyPreview | null;
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
  /** Viewer-private pin for this chat. */
  pinned: boolean;
  unreadCount: number;
  lastMessage: MessageView | null;
  lastMessageAt: string;
  counterpart: PublicCompanySummary | null;
  participantCount: number;
}

export interface ThreadDetail extends ThreadSummary {
  participants: ParticipantView[];
}
