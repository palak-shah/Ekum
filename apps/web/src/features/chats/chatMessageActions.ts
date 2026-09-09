import {
  MAX_FORWARD_BATCH,
  MessageType,
  canDeleteForEveryoneMeta,
  canEditMessageMeta,
  photoUrlsFromMessage,
  shortOrderLabel,
  type MessageView,
} from '@ekum/domain-types';

export { MAX_FORWARD_BATCH };

/** Forward is free when the card (or photos/text) can be re-posted. Relist is a different verb. */
export function canForwardMessage(message: MessageView): boolean {
  if (message.deletedForEveryone) return false;
  if (message.type === 'text') {
    return Boolean(message.body?.trim());
  }
  if (message.type === 'photo') {
    return photoUrlsFromMessage(message).length > 0;
  }
  if (message.type === 'voice') {
    return Boolean(message.body?.trim());
  }
  if (message.type === 'product_card' || message.type === 'collection_card') {
    return Boolean(message.reference?.available && message.reference.id);
  }
  if (message.type === 'order_card' || message.type === 'rate') {
    return Boolean(message.reference?.id && message.reference.available);
  }
  return false;
}

export function canReplyToMessage(message: MessageView): boolean {
  if (message.deletedForEveryone) return false;
  return [
    'text',
    'photo',
    'voice',
    'product_card',
    'collection_card',
    'order_card',
    'rate',
    'payment_card',
  ].includes(message.type);
}

export function canCopyMessage(message: MessageView): boolean {
  if (message.deletedForEveryone) return false;
  return Boolean(copyTextForMessage(message));
}

export function copyTextForMessage(message: MessageView): string | null {
  if (message.deletedForEveryone) return null;
  if (message.type === 'text') {
    const body = message.body?.trim();
    return body || null;
  }
  if (message.type === 'photo') {
    const n = photoUrlsFromMessage(message).length;
    return n > 1 ? `${n} photos` : 'Photo';
  }
  if (message.type === 'voice') {
    return 'Voice';
  }
  const name = message.reference?.name?.trim();
  if (message.type === 'collection_card') {
    return name ? `Collection · ${name}` : 'Collection';
  }
  if (message.type === 'product_card') {
    return name ? `Design · ${name}` : 'Design';
  }
  if (message.type === 'order_card' || message.type === 'rate') {
    if (message.reference?.orderLabel) return message.reference.orderLabel;
    if (message.reference?.id) return shortOrderLabel(message.reference.id);
    return name || 'Order';
  }
  if (message.type === 'payment_card') {
    return name || message.reference?.totalLabel || 'Payment';
  }
  return null;
}

export function canEditMessage(message: MessageView, now = new Date()): boolean {
  return canEditMessageMeta({
    mine: message.mine,
    type: message.type,
    createdAt: message.createdAt,
    deletedForEveryone: Boolean(message.deletedForEveryone),
    now,
  });
}

export function canDeleteForEveryone(message: MessageView, now = new Date()): boolean {
  return (
    message.canDeleteForEveryone ??
    canDeleteForEveryoneMeta({
      mine: message.mine,
      createdAt: message.createdAt,
      deletedForEveryone: Boolean(message.deletedForEveryone),
      now,
    })
  );
}

export function forwardPayload(message: MessageView): {
  type: string;
  body?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
} {
  if (message.deletedForEveryone) {
    throw new Error('This message cannot be forwarded');
  }
  if (message.type === 'text') {
    const body = message.body?.trim();
    if (!body) throw new Error('Nothing to forward');
    return { type: MessageType.Text, body };
  }
  if (message.type === 'photo') {
    const urls = photoUrlsFromMessage(message);
    const first = urls[0];
    if (!first) {
      throw new Error('No photos to forward');
    }
    return { type: 'photo', body: first, metadata: { urls } };
  }
  if (message.type === 'voice') {
    const body = message.body?.trim();
    if (!body) throw new Error('Nothing to forward');
    const meta =
      message.metadata && typeof message.metadata === 'object'
        ? (message.metadata as Record<string, unknown>)
        : {};
    return {
      type: MessageType.Voice,
      body,
      metadata: {
        durationMs: typeof meta.durationMs === 'number' ? meta.durationMs : 1000,
        ...(typeof meta.mediaId === 'string' ? { mediaId: meta.mediaId } : {}),
      },
    };
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
  if (message.type === 'order_card' || message.type === 'rate') {
    const referenceId = message.reference?.id;
    if (!referenceId || !message.reference?.available) {
      throw new Error('Nothing to forward');
    }
    return {
      type: message.type === 'rate' ? MessageType.Rate : MessageType.OrderCard,
      referenceId,
      body: message.reference.name ?? undefined,
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
