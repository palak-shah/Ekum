import { photoUrlsFromMessage, type MessageView } from '@ekum/domain-types';

/**
 * Forward is hidden (not disabled) when the supplier locked the card and the
 * viewer is not the catalog owner.
 */
export function canForwardMessage(
  message: MessageView,
  viewerCompanyId?: string | null,
): boolean {
  if (message.type === 'photo') {
    return photoUrlsFromMessage(message).length > 0;
  }
  if (message.type === 'product_card' || message.type === 'collection_card') {
    if (!message.reference?.available || !message.reference.id) {
      return false;
    }
    if (message.reference.allowForward === false) {
      const ownerId = message.reference.ownerCompanyId;
      return Boolean(viewerCompanyId && ownerId && viewerCompanyId === ownerId);
    }
    return true;
  }
  return false;
}

export function canReplyToMessage(message: MessageView): boolean {
  return [
    'text',
    'photo',
    'product_card',
    'collection_card',
    'order_card',
    'rate',
  ].includes(message.type);
}

export function forwardPayload(message: MessageView): {
  type: string;
  body?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
} {
  if (message.type === 'photo') {
    const urls = photoUrlsFromMessage(message);
    const first = urls[0];
    if (!first) {
      throw new Error('No photos to forward');
    }
    return { type: 'photo', body: first, metadata: { urls } };
  }
  if (message.type === 'product_card' || message.type === 'collection_card') {
    const referenceId = message.reference?.id;
    if (!referenceId) {
      throw new Error('Nothing to forward');
    }
    return {
      type: message.type,
      referenceId,
      body: message.reference?.name ?? message.body ?? undefined,
    };
  }
  throw new Error('This message cannot be forwarded');
}

export function replyComposerLabel(message: MessageView): string {
  if (message.reference?.name) {
    if (message.reference.kind === 'collection') {
      return `Collection · ${message.reference.name}`;
    }
    if (message.reference.kind === 'product') {
      return `Design · ${message.reference.name}`;
    }
    return message.reference.name;
  }
  if (message.type === 'photo') {
    const count = photoUrlsFromMessage(message).length;
    return count > 1 ? `${count} photos` : 'Photo';
  }
  const body = message.body?.trim();
  if (body) {
    return body.length > 60 ? `${body.slice(0, 60)}…` : body;
  }
  return 'Message';
}
