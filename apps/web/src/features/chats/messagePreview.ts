import type { ComponentType, SVGProps } from 'react';
import { photoUrlsFromMessage, type MessageView } from '@ekum/domain-types';
import { statusLabel } from '@/lib/status';
import {
  CameraIcon,
  ChatIcon,
  CollectionIcon,
  DocumentIcon,
  OrdersIcon,
  ProductIcon,
  QuoteIcon,
  ReturnIcon,
} from '@/ui/icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type ChatObjectKind =
  | 'product'
  | 'collection'
  | 'order'
  | 'quote'
  | 'return'
  | 'document'
  | 'photo'
  | 'text'
  | 'other';

export interface ChatTypeMeta {
  kind: ChatObjectKind;
  label: string;
  Icon: IconComponent;
}

/** Shared type language for chat list previews and thread cards. */
export function chatTypeMeta(type: string | undefined | null): ChatTypeMeta {
  switch (type) {
    case 'product_card':
      return { kind: 'product', label: 'Design', Icon: ProductIcon };
    case 'collection_card':
      return { kind: 'collection', label: 'Collection', Icon: CollectionIcon };
    case 'order_card':
      return { kind: 'order', label: 'Order', Icon: OrdersIcon };
    case 'rate':
      return { kind: 'quote', label: 'Quote', Icon: QuoteIcon };
    case 'photo':
      return { kind: 'photo', label: 'Photo', Icon: CameraIcon };
    case 'return_card':
      return { kind: 'return', label: 'Return', Icon: ReturnIcon };
    case 'document':
      return { kind: 'document', label: 'Document', Icon: DocumentIcon };
    case 'text':
      return { kind: 'text', label: 'Message', Icon: ChatIcon };
    default:
      return { kind: 'other', label: 'Attachment', Icon: DocumentIcon };
  }
}

/** Action-aware one-line preview for the chats inbox. */
export function messagePreviewText(message: MessageView | null | undefined): string {
  if (!message) {
    return 'No messages yet';
  }
  const name = message.reference?.name?.trim() || message.body?.trim() || null;
  const status = message.reference?.status
    ? statusLabel(message.reference.status)
    : null;

  let core: string;
  switch (message.type) {
    case 'text':
      core = message.body?.trim() || 'Message';
      break;
    case 'photo': {
      const count = photoUrlsFromMessage(message).length;
      core = count > 1 ? `${count} photos` : 'Photo';
      break;
    }
    case 'product_card':
    case 'collection_card':
      core = name ? `Shared: ${name}` : 'Shared a card';
      break;
    case 'order_card': {
      const side =
        message.reference?.direction === 'buying'
          ? 'Buying'
          : message.reference?.direction === 'selling'
            ? 'Selling'
            : null;
      if (message.reference?.status === 'confirmed') {
        const by = message.reference.confirmedByName;
        core = by
          ? side
            ? `${side} · Confirmed by ${by}`
            : `Confirmed by ${by}`
          : side
            ? `${side} · Confirmed`
            : 'Order confirmed';
      } else if (status) {
        core = side ? `${side} · Order ${status.toLowerCase()}` : `Order ${status.toLowerCase()}`;
      } else {
        core = name ? `Order · ${name}` : 'Order update';
      }
      break;
    }
    case 'rate':
      core = message.reference?.totalLabel
        ? `Quote · ${message.reference.totalLabel}`
        : status
          ? `Quote · ${status}`
          : 'Quote';
      break;
    default:
      core = name || 'Shared a card';
  }

  return message.mine ? `You: ${core}` : core;
}

export function messagePreviewSearchBlob(message: MessageView | null | undefined): string {
  return messagePreviewText(message).toLowerCase();
}
