import { z } from 'zod';

/**
 * The single error envelope shape every API error is serialised into. No
 * controller hand-rolls its own error shape; internal details never leak.
 */
export const errorEnvelopeSchema = z.object({
  statusCode: z.number(),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  timestamp: z.string(),
  path: z.string().optional(),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/**
 * Cursor pagination for insert-heavy, feed-like resources (messages,
 * notifications, explore) where offset pagination breaks under concurrent inserts.
 */
export const cursorPageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorPageQuery = z.infer<typeof cursorPageQuerySchema>;

export interface CursorPage<T> {
  results: T[];
  nextCursor: string | null;
}

/**
 * Classic offset pagination for smaller, rarely-changing lists (e.g. a
 * company's own product library) where jumping to a page is useful.
 */
export const offsetPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type OffsetPageQuery = z.infer<typeof offsetPageQuerySchema>;

export interface OffsetPage<T> {
  results: T[];
  total: number;
  page: number;
  pageSize: number;
}
