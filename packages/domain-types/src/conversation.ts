import { z } from 'zod';
import { cursorPageQuerySchema } from './common';
import type { AuditActorView } from './catalog';
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

const cardTypes = [
  MessageType.ProductCard,
  MessageType.CollectionCard,
  MessageType.OrderCard,
  MessageType.Rate,
] as const;
const needsBodyTypes = [MessageType.Text, MessageType.Photo, MessageType.Voice] as const;

export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const MESSAGE_DELETE_EVERYONE_WINDOW_MS = 60 * 60 * 1000;
export const MAX_FORWARD_BATCH = 10;

export function messageWithinWindow(
  createdAt: Date | string,
  windowMs: number,
  now: Date = new Date(),
): boolean {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return now.getTime() - created.getTime() <= windowMs;
}

export function canEditMessageMeta(input: {
  mine: boolean;
  type: string;
  createdAt: Date | string;
  deletedForEveryone?: boolean;
  now?: Date;
}): boolean {
  return (
    input.mine &&
    input.type === MessageType.Text &&
    !input.deletedForEveryone &&
    messageWithinWindow(input.createdAt, MESSAGE_EDIT_WINDOW_MS, input.now)
  );
}

export function canDeleteForEveryoneMeta(input: {
  mine: boolean;
  createdAt: Date | string;
  deletedForEveryone?: boolean;
  now?: Date;
}): boolean {
  return (
    input.mine &&
    !input.deletedForEveryone &&
    messageWithinWindow(input.createdAt, MESSAGE_DELETE_EVERYONE_WINDOW_MS, input.now)
  );
}

/** Photo album: ordered blob URL references (no image bytes in chat). */
export const photoMessageMetadataSchema = z.object({
  urls: z.array(z.string().trim().min(1)).min(1),
});
export type PhotoMessageMetadata = z.infer<typeof photoMessageMetadataSchema>;

/** Voice clip: duration + optional media id (body holds the playable URL). */
export const VOICE_MAX_DURATION_MS = 120_000;
export const voiceMessageMetadataSchema = z.object({
  durationMs: z.number().int().positive().max(VOICE_MAX_DURATION_MS),
  mediaId: z.string().min(1).optional(),
});
export type VoiceMessageMetadata = z.infer<typeof voiceMessageMetadataSchema>;

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

export function voiceDurationMsFromMessage(metadata: unknown): number | null {
  const parsed = voiceMessageMetadataSchema.safeParse(metadata);
  return parsed.success ? parsed.data.durationMs : null;
}

export const startDirectThreadSchema = z.object({
  companyId: z.string().min(1),
  /** Extra staff to put on this chat. Owners are always added. */
  memberUserIds: z.array(z.string().min(1)).max(50).optional(),
  /** Ignored. New chats are always shared. */
  visibility: z.enum(threadVisibilityValues).default(ThreadVisibility.Shared),
});
export type StartDirectThreadDto = z.infer<typeof startDirectThreadSchema>;

export const createGroupThreadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  participantCompanyIds: z.array(z.string().min(1)).min(1).max(50),
  memberUserIds: z.array(z.string().min(1)).max(50).optional(),
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
            : value.type === MessageType.Voice
              ? 'A voice message needs an audio URL.'
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
    if (value.type === MessageType.Voice) {
      const parsed = voiceMessageMetadataSchema.safeParse(value.metadata ?? {});
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Voice messages need metadata.durationMs (max 2 minutes).',
          path: ['metadata', 'durationMs'],
        });
      }
    }
  });
export type SendMessageDto = z.infer<typeof sendMessageSchema>;

export const editMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});
export type EditMessageDto = z.infer<typeof editMessageSchema>;

export const listStarredMessagesQuerySchema = cursorPageQuerySchema;
export type ListStarredMessagesQuery = z.infer<typeof listStarredMessagesQuerySchema>;

export const listThreadsQuerySchema = cursorPageQuerySchema.extend({
  state: z.enum(threadParticipantStateValues).optional(),
  /** Inbox search: company name and/or message content. */
  q: z.string().trim().max(80).optional(),
});
export type ListThreadsQuery = z.infer<typeof listThreadsQuerySchema>;

/** Thread message list: optional scope chips + in-chat search. */
export const threadMessageViewValues = [
  'all',
  'photos',
  'collections',
  'designs',
  'orders',
  'starred',
  /** @deprecated Use `photos` — kept for older clients. */
  'media',
] as const;
export type ThreadMessageView = (typeof threadMessageViewValues)[number];

export const listThreadMessagesQuerySchema = cursorPageQuerySchema.extend({
  view: z.enum(threadMessageViewValues).optional().default('all'),
  q: z.string().trim().max(80).optional(),
});
export type ListThreadMessagesQuery = z.infer<typeof listThreadMessagesQuerySchema>;

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

export const setThreadMembersSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(50),
});
export type SetThreadMembersDto = z.infer<typeof setThreadMembersSchema>;

export interface ThreadPersonView {
  userId: string;
  name: string;
  role: string;
  state: string;
}

export interface ThreadCloneConflict {
  code: 'SAME_CHAT';
  message: string;
  threadId: string;
  title: string | null;
}

// --- View models ------------------------------------------------------------

export interface MessageReference {
  kind: 'product' | 'collection' | 'order' | 'rate' | 'payment';
  id: string;
  name: string | null;
  image: string | null;
  /**
   * Preview images for WhatsApp-style grids in chat.
   * Collection: first design thumbs. Product: product photos.
   */
  images?: string[] | null;
  /**
   * When true, chat may show small blurred thumbs but must not open PhotoViewer.
   * Viewer lacks design view rights; opening the pack still uses Ask / shell.
   */
  imagesLocked?: boolean;
  /** Catalog owner company (product/collection) — not the message forwarder. */
  ownerCompanyId?: string | null;
  ownerCompanyName?: string | null;
  /**
   * When false, non-owners must not forward/re-share this card.
   * Omitted/true = forward allowed.
   */
  allowForward?: boolean;
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
  /** Frozen chat event (order_requested | quote_sent | cancelled | …). */
  event?: string | null;
  /** Display eyebrow for the frozen event. */
  eventLabel?: string | null;
  /** Frozen order label from metadata, e.g. Order #X16Y. */
  orderLabel?: string | null;
  /** Frozen actor display from metadata (company name at send time). */
  actorLabel?: string | null;
  /**
   * Live affordance: buyer can still accept this quote right now.
   * Not frozen history — quote card copy/status stay as posted.
   */
  canAcceptQuote?: boolean;
  /** Seller-logged ticket: buyer may Accept (not Accept quote). */
  canAcceptLogged?: boolean;
  /**
   * Live order intent (inquiry | order). Like canAcceptQuote — not frozen history.
   * Chat CTAs use this so Ask-rates tickets say View inquiry until firmed.
   */
  intent?: 'order' | 'inquiry' | null;
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
  /** Same company as viewer — bubble alignment (not necessarily the viewer). */
  mine: boolean;
  /** Teammate who sent when mine && not you. Never exposed to other companies. */
  actor: AuditActorView | null;
  replyTo: MessageReplyPreview | null;
  editedAt?: string | null;
  deletedForEveryone?: boolean;
  starred?: boolean;
  canEdit?: boolean;
  canDeleteForEveryone?: boolean;
}

export interface StarredMessageView {
  message: MessageView;
  threadId: string;
  threadTitle: string | null;
  counterpartName: string | null;
  starredAt: string;
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
  /**
   * When inbox `q` matched inside the thread (not only the title), muted why-line
   * e.g. `In chat · Order #OKYD`. Null/omitted → show last-message preview.
   */
  searchHitPreview?: string | null;
  /** Message id for deep link `?message=` when searchHitPreview is set. */
  searchHitMessageId?: string | null;
}

/** How POST /threads/direct resolved the 1:1 (not sent on list/detail reads). */
export type DirectThreadOpen = 'created' | 'existing' | 'restored';

export interface StartDirectThreadResult extends ThreadSummary {
  opened: DirectThreadOpen;
}

export interface ThreadDetail extends ThreadSummary {
  participants: ParticipantView[];
  /** Your shop’s people on this thread (never sent to the other company). */
  people?: ThreadPersonView[];
  canLeave?: boolean;
  canRemoveGroup?: boolean;
  canManagePeople?: boolean;
}
