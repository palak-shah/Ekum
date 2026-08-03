import { api } from './apiClient';
import type { PushSubscriptionDto } from '@ekum/domain-types';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined;

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function toDto(subscription: PushSubscription): PushSubscriptionDto {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
  };
}

/** Subscribes this browser to web push and registers it with the API. */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) {
    return false;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }));
  await api.post('/notifications/push', toDto(subscription));
  return true;
}

export async function disablePush(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await api.del('/notifications/push', { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }
}
