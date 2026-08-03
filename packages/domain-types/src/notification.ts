import { z } from 'zod';
import { cursorPageQuerySchema } from './common';
import { notificationTypeValues } from './enums';

/**
 * Notifications. The feed is company-scoped; delivery preferences and web-push
 * subscriptions are per-user (per-device). Per-thread muting lives in the
 * Conversation domain. Notifications never originate work — they are a pure
 * projection of documented domain events.
 */
export const listNotificationsQuerySchema = cursorPageQuerySchema.extend({
  unreadOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const updateNotificationPreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  mutedTypes: z.array(z.enum(notificationTypeValues)).max(20).optional(),
});
export type UpdateNotificationPreferencesDto = z.infer<
  typeof updateNotificationPreferencesSchema
>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});
export type PushSubscriptionDto = z.infer<typeof pushSubscriptionSchema>;

export const unsubscribePushSchema = z.object({
  endpoint: z.string().url(),
});
export type UnsubscribePushDto = z.infer<typeof unsubscribePushSchema>;

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string | null;
  refType: string | null;
  refId: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferencesView {
  pushEnabled: boolean;
  mutedTypes: string[];
}
