import type { ComponentType, SVGProps } from 'react';
import { photoUrlsFromMessage, type MessageView } from '@ekum/domain-types';
import {
  CameraIcon,
  ChatIcon,
  CollectionIcon,
  DocumentIcon,
  MicIcon,
  OrdersIcon,
  ProductIcon,
  QuoteIcon,
  ReturnIcon,
} from '@/ui/icons';
import { orderMessagePreviewCore } from './orderCardCopy';

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
    case 'voice':
      return { kind: 'other', label: 'Voice', Icon: MicIcon };
    case 'return_card':
      return { kind: 'return', label: 'Return', Icon: ReturnIcon };
    case 'payment_card':
      return { kind: 'order', label: 'Payment', Icon: OrdersIcon };
    case 'document':
      return { kind: 'document', label: 'Document', Icon: DocumentIcon };
    case 'text':
      return { kind: 'text', label: 'Message', Icon: ChatIcon };
    default:
      return { kind: 'other', label: 'Attachment', Icon: DocumentIcon };
  }
}

/** Resolve message type for inbox preview icon (legacy system order notices → order_card). */
export function inboxPreviewTypeKey(message: MessageView | null | undefined): string | null {
  if (!message || message.type === 'text') {
    return null;
  }
  const meta =
    message.metadata && typeof message.metadata === 'object'
      ? (message.metadata as Record<string, unknown>)
      : null;
  const ref = message.reference;
  if (
    message.type === 'system' &&
    Boolean(ref?.id) &&
    (ref?.kind === 'order' || meta?.kind === 'order_lines')
  ) {
    return 'order_card';
  }
  return message.type;
}

/** Outbound label for your company's messages: teammate name or You. */
export function outboundMessageLabel(message: MessageView): string {
  return message.actor?.name?.trim() || 'You';
}

/** Minimal in-card sender: teammate on outgoing; business name on incoming. */
export function inCardSenderLine(message: MessageView, partyLabel: string): string | null {
  if (message.mine) {
    return message.actor?.name?.trim() || null;
  }
  return partyLabel.trim() || null;
}

/** Action-aware one-line preview for the chats inbox. */
export function messagePreviewText(message: MessageView | null | undefined): string {
  if (!message) {
    return 'No messages yet';
  }
  const name = message.reference?.name?.trim() || message.body?.trim() || null;

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
    case 'voice':
      core = 'Voice';
      break;
    case 'product_card':
    case 'collection_card':
      core = name ? `Shared: ${name}` : 'Shared a card';
      break;
    case 'payment_card':
      core = name || 'Payment';
      break;
    case 'order_card':
    case 'rate': {
      core = orderMessagePreviewCore(message) ?? (message.type === 'rate' ? 'Quote' : 'Order update');
      break;
    }
    case 'system': {
      const orderPreview = orderMessagePreviewCore(message);
      if (orderPreview) {
        core = orderPreview;
        break;
      }
      core = name || message.body?.trim() || 'Update';
      break;
    }
    default:
      core = name || 'Shared a card';
  }

  return message.mine ? `${outboundMessageLabel(message)} · ${core}` : core;
}

export function messagePreviewSearchBlob(message: MessageView | null | undefined): string {
  return messagePreviewText(message).toLowerCase();
}
