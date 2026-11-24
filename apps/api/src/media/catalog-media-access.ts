import { mapMediaUrlsForViewer, type MediaAccessKind } from './media-url-token';

/**
 * Who may use PhotoViewer / DesignSheet **Download**.
 * Media image URL strings stay plain for every viewer (no token / no forced thumb rewrite).
 */
export function catalogMediaAccess(input: {
  viewerCompanyId: string | null | undefined;
  ownerCompanyId: string;
  allowDownload?: boolean | null;
}): MediaAccessKind {
  if (input.viewerCompanyId && input.viewerCompanyId === input.ownerCompanyId) {
    return 'full';
  }
  if (input.allowDownload === true) return 'full';
  return 'preview';
}

export function applyProductMediaAccess<
  T extends { companyId: string; allowDownload?: boolean | null; images: string[] },
>(product: T, viewerCompanyId: string | null | undefined): T {
  const access = catalogMediaAccess({
    viewerCompanyId,
    ownerCompanyId: product.companyId,
    allowDownload: product.allowDownload,
  });
  return {
    ...product,
    images: mapMediaUrlsForViewer(product.images, access),
  };
}

export function applyCollectionMediaAccess<
  T extends {
    companyId: string;
    allowDownload?: boolean | null;
    coverImage?: string | null;
    previewImages?: string[];
    libraryThumb?: string | null;
    products?: Array<{
      companyId: string;
      allowDownload?: boolean | null;
      images: string[];
    }>;
  },
>(collection: T, viewerCompanyId: string | null | undefined): T {
  const packAccess = catalogMediaAccess({
    viewerCompanyId,
    ownerCompanyId: collection.companyId,
    allowDownload: collection.allowDownload,
  });
  const coverImage = collection.coverImage
    ? mapMediaUrlsForViewer([collection.coverImage], packAccess)[0] ?? null
    : collection.coverImage;
  const previewImages = collection.previewImages
    ? mapMediaUrlsForViewer(collection.previewImages, packAccess)
    : collection.previewImages;
  const libraryThumb = collection.libraryThumb
    ? mapMediaUrlsForViewer([collection.libraryThumb], packAccess)[0] ?? null
    : collection.libraryThumb;
  const products = collection.products?.map((product) =>
    applyProductMediaAccess(product, viewerCompanyId),
  );
  return {
    ...collection,
    coverImage,
    previewImages,
    libraryThumb,
    ...(products ? { products } : {}),
  };
}
