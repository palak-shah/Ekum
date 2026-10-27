import type { ProductView } from '@ekum/domain-types';
import type { BrowseShortlistEntry } from './browseShortlist';

/** Stage one design for DesignSheet cart / Message / Share / Order. */
export function designSheetShortlistEntry(
  product: Pick<
    ProductView,
    | 'id'
    | 'name'
    | 'images'
    | 'companyId'
    | 'companyName'
    | 'allowForward'
    | 'categories'
    | 'unit'
    | 'dispatchUnit'
    | 'piecesPerPack'
    | 'moq'
    | 'rate'
    | 'rateMax'
    | 'status'
  >,
  companyNameFallback = '',
  pack?: {
    collectionId: string;
    handlerName: string;
    path: string | null;
    allowForward: boolean;
  },
): BrowseShortlistEntry {
  const path = pack?.path === 'handle' || pack?.path === 'direct' ? pack.path : undefined;
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: product.companyId,
    companyName: product.companyName ?? companyNameFallback,
    allowForward: product.allowForward,
    categories: product.categories ?? [],
    unit: product.unit ?? null,
    dispatchUnit: product.dispatchUnit ?? null,
    piecesPerPack: product.piecesPerPack ?? null,
    moq: product.moq ?? null,
    rate: product.rate ?? null,
    rateMax: product.rateMax ?? null,
    ...(product.status ? { status: product.status } : {}),
    ...(pack
      ? {
          sourceCollectionId: pack.collectionId,
          sourceHandlerName: pack.handlerName,
          sourcePath: path,
          sourcePackAllowForward: pack.allowForward !== false,
        }
      : {}),
  };
}
