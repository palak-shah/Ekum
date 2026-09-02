/**
 * Platform object-kind colors (Order / Collection / Design).
 * Mirror of status tones — kind vocabulary and colour never drift between screens.
 * Status (success / danger / tangerine) stays separate.
 */
import type { ChatObjectKind } from '@/features/chats/messagePreview';

export type KindTone = 'order' | 'collection' | 'design';

export interface KindToneClasses {
  /** Text / icon ink */
  ink: string;
  /** Soft fill for badges / active chips */
  soft: string;
  /** Left border rail */
  rail: string;
  /** Icon badge: soft bg + ink */
  badge: string;
}

const KIND_CLASSES: Record<KindTone, KindToneClasses> = {
  order: {
    ink: 'text-kind-order',
    soft: 'bg-kind-order-soft',
    rail: 'border-l-kind-order',
    badge: 'bg-kind-order-soft text-kind-order',
  },
  collection: {
    ink: 'text-kind-collection',
    soft: 'bg-kind-collection-soft',
    rail: 'border-l-kind-collection',
    badge: 'bg-kind-collection-soft text-kind-collection',
  },
  design: {
    ink: 'text-kind-design',
    soft: 'bg-kind-design-soft',
    rail: 'border-l-kind-design',
    badge: 'bg-kind-design-soft text-kind-design',
  },
};

/** Map chat object kinds (and payment/quote) onto the three platform tones. */
export function kindToneForChatKind(kind: ChatObjectKind | string | null | undefined): KindTone | null {
  switch (kind) {
    case 'order':
    case 'quote':
    case 'payment':
      return 'order';
    case 'collection':
      return 'collection';
    case 'product':
    case 'design':
      return 'design';
    default:
      return null;
  }
}

/** Resolve from message / attach type strings (`order_card`, `product_card`, …). */
export function kindToneForMessageType(type: string | null | undefined): KindTone | null {
  switch (type) {
    case 'order_card':
    case 'rate':
    case 'payment_card':
      return 'order';
    case 'collection_card':
    case 'collections':
      return 'collection';
    case 'product_card':
    case 'designs':
      return 'design';
    case 'orders':
      return 'order';
    default:
      return null;
  }
}

export function kindToneClasses(tone: KindTone): KindToneClasses {
  return KIND_CLASSES[tone];
}

export function kindToneClassesForChatKind(
  kind: ChatObjectKind | string | null | undefined,
): KindToneClasses | null {
  const tone = kindToneForChatKind(kind);
  return tone ? KIND_CLASSES[tone] : null;
}

export function kindToneClassesForMessageType(
  type: string | null | undefined,
): KindToneClasses | null {
  const tone = kindToneForMessageType(type);
  return tone ? KIND_CLASSES[tone] : null;
}
