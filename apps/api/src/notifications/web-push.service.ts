import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebPushError, sendNotification, setVapidDetails } from 'web-push';
import type { PushSubscription } from '@prisma/client';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string | null;
  type: string;
}

/**
 * Sends web push over VAPID. If keys are unconfigured it is a no-op, so the
 * in-app feed keeps working in every environment. Dead subscriptions (404/410)
 * are pruned so we do not keep pushing to unsubscribed browsers.
 */
@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private readonly enabled: boolean;

  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    const publicKey = config.get('WEB_PUSH_PUBLIC_KEY', { infer: true });
    const privateKey = config.get('WEB_PUSH_PRIVATE_KEY', { infer: true });
    const subject = config.get('WEB_PUSH_SUBJECT', { infer: true });
    this.enabled = Boolean(publicKey && privateKey);
    if (this.enabled && publicKey && privateKey) {
      setVapidDetails(subject, publicKey, privateKey);
    }
  }

  async sendMany(subscriptions: PushSubscription[], payload: PushPayload): Promise<void> {
    if (!this.enabled || subscriptions.length === 0) {
      return;
    }
    await Promise.all(subscriptions.map((subscription) => this.sendOne(subscription, payload)));
  }

  private async sendOne(subscription: PushSubscription, payload: PushPayload): Promise<void> {
    try {
      await sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
      );
    } catch (error) {
      if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
        await this.prisma.pushSubscription.deleteMany({ where: { endpoint: subscription.endpoint } });
        return;
      }
      this.logger.warn(
        `Web push to ${subscription.endpoint} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
