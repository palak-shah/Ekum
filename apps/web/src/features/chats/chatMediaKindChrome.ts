import type { ComponentType, SVGProps } from 'react';
import {
  ChatIcon,
  CollectionIcon,
  DocumentIcon,
  ImageIcon,
  ProductIcon,
} from '@/ui/icons';
import { kindToneClasses } from '@/lib/kindTone';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Tile on In chats / group Media — icons + kind colors, not two-letter initials. */
export function chatMediaKindChrome(kind: string): { Icon: IconComponent; badge: string } {
  switch (kind) {
    case 'photos':
      return { Icon: ImageIcon, badge: 'bg-foam text-accent' };
    case 'documents':
      return { Icon: DocumentIcon, badge: 'bg-linen text-slate' };
    case 'designs':
      return { Icon: ProductIcon, badge: kindToneClasses('design').badge };
    case 'collections':
      return { Icon: CollectionIcon, badge: kindToneClasses('collection').badge };
    case 'links':
      return { Icon: ChatIcon, badge: 'bg-foam text-muted' };
    default:
      return { Icon: DocumentIcon, badge: 'bg-linen text-muted' };
  }
}
