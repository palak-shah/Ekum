import {
  UniversalShareSheet,
  type CatalogShareCollectionItem,
  type CatalogShareProductItem,
} from '@/features/share/UniversalShareSheet';

export type { CatalogShareCollectionItem, CatalogShareProductItem };

/**
 * Catalogue → chat(s) — thin wrapper over UniversalShareSheet (catalog payload).
 */
export function CatalogShareSheet({
  open,
  onClose,
  collections = [],
  products = [],
  /** @deprecated use collections */
  items,
  onShared,
}: {
  open: boolean;
  onClose: () => void;
  collections?: CatalogShareCollectionItem[];
  products?: CatalogShareProductItem[];
  items?: CatalogShareCollectionItem[];
  onShared?: () => void;
}) {
  return (
    <UniversalShareSheet
      open={open}
      onClose={onClose}
      payload={{
        kind: 'catalog',
        collections,
        products,
        items,
        onShared,
      }}
    />
  );
}
