import { Injectable } from '@nestjs/common';
import type { Notification } from '@prisma/client';
import {
  NotificationType,
  type CursorPage,
  type ListNotificationsQuery,
  type NotificationPreferencesView,
  type NotificationView,
  type PushSubscriptionDto,
  type UpdateNotificationPreferencesDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { cursorArgs, toCursorPage } from '../discovery/pagination';
import { WebPushService } from './web-push.service';

export interface CreateNotificationInput {
  recipientCompanyId: string;
  type: string;
  title: string;
  body?: string | null;
  refType?: string | null;
  refId?: string | null;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
  ) {}

  /** Projects a domain event into a feed entry and fans out push to the recipient's users. */
  async create(input: CreateNotificationInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        recipientCompanyId: input.recipientCompanyId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
      },
    });
    await this.deliverPush(input);
  }

  async createForMany(recipientCompanyIds: string[], base: Omit<CreateNotificationInput, 'recipientCompanyId'>): Promise<void> {
    await Promise.all(
      [...new Set(recipientCompanyIds)].map((recipientCompanyId) =>
        this.create({ ...base, recipientCompanyId }),
      ),
    );
  }

  async list(
    companyId: string,
    query: ListNotificationsQuery,
  ): Promise<CursorPage<NotificationView>> {
    const rows = await this.prisma.notification.findMany({
      where: { recipientCompanyId: companyId, ...(query.unreadOnly ? { readAt: null } : {}) },
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.toView(row));
  }

  async unreadCount(companyId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { recipientCompanyId: companyId, readAt: null },
    });
    return { count };
  }

  async markAllRead(companyId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { recipientCompanyId: companyId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markRead(companyId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { id, recipientCompanyId: companyId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async getPreferences(userId: string): Promise<NotificationPreferencesView> {
    const preference = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    return {
      pushEnabled: preference?.pushEnabled ?? true,
      mutedTypes: preference?.mutedTypes ?? [],
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesView> {
    const preference = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        pushEnabled: dto.pushEnabled ?? true,
        mutedTypes: dto.mutedTypes ?? [],
      },
      update: {
        ...(dto.pushEnabled === undefined ? {} : { pushEnabled: dto.pushEnabled }),
        ...(dto.mutedTypes === undefined ? {} : { mutedTypes: dto.mutedTypes }),
      },
    });
    return { pushEnabled: preference.pushEnabled, mutedTypes: preference.mutedTypes };
  }

  async subscribePush(userId: string, dto: PushSubscriptionDto): Promise<{ ok: true }> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: { userId, endpoint: dto.endpoint, p256dh: dto.p256dh, auth: dto.auth },
      update: { userId, p256dh: dto.p256dh, auth: dto.auth },
    });
    return { ok: true };
  }

  async unsubscribePush(userId: string, endpoint: string): Promise<{ ok: true }> {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { ok: true };
  }

  /**
   * The daily digest sweep (invoked by the notification.digest job). Pushes each
   * company with unread notifications a single summary — no new feed rows, so the
   * digest never becomes noise it must then summarise. Push honours per-user
   * preferences; the digest type must not be muted.
   */
  async sendDailyDigest(): Promise<{ companiesNotified: number }> {
    const unread = await this.prisma.notification.groupBy({
      by: ['recipientCompanyId'],
      where: { readAt: null },
      _count: { _all: true },
    });

    let companiesNotified = 0;
    for (const row of unread) {
      const count = row._count._all;
      if (count === 0) {
        continue;
      }
      await this.deliverPush({
        recipientCompanyId: row.recipientCompanyId,
        type: NotificationType.Digest,
        title: 'Your Ekum summary',
        body: `You have ${count} unread update${count === 1 ? '' : 's'}.`,
      });
      companiesNotified += 1;
    }
    return { companiesNotified };
  }

  private async deliverPush(input: CreateNotificationInput): Promise<void> {
    const memberships = await this.prisma.companyMembership.findMany({
      where: { companyId: input.recipientCompanyId },
      select: { userId: true },
    });
    if (memberships.length === 0) {
      return;
    }
    const userIds = memberships.map((membership) => membership.userId);
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId: { in: userIds } },
    });
    const preferenceByUser = new Map(preferences.map((preference) => [preference.userId, preference]));

    const eligibleUserIds = userIds.filter((userId) => {
      const preference = preferenceByUser.get(userId);
      if (!preference) {
        return true; // No row means all defaults: push on.
      }
      return preference.pushEnabled && !preference.mutedTypes.includes(input.type);
    });
    if (eligibleUserIds.length === 0) {
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: { in: eligibleUserIds } },
    });
    await this.webPush.sendMany(subscriptions, {
      title: input.title,
      body: input.body ?? null,
      type: input.type,
    });
  }

  private toView(notification: Notification): NotificationView {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      refType: notification.refType,
      refId: notification.refId,
      read: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
