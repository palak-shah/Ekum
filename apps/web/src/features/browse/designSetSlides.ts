import { formatRate } from '@/lib/format';
import { packFeedDetailLine } from '@/ui/albumMosaic';

export type DesignSetSlideSource = {
  id: string;
  name: string;
  images: string[];
  companyName: string;
  rate?: number | null;
  unit?: string | null;
  moq?: number | null;
  categories?: string[];
};

export type DesignSetSlide = {
  url: string;
  caption: string;
  detail: string;
  productId: string;
};

export function designShopLine(companyName: string): string {
  const name = companyName.trim();
  return name ? `From ${name}` : '';
}

export function designSetFactLines(input: {
  images: string[];
  companyName: string;
  rate?: number | null;
  unit?: string | null;
  moq?: number | null;
  categories?: string[];
}): { meta: string; detail: string } {
  const photos = input.images.map((url) => url.trim()).filter(Boolean).length;
  const rate = input.rate != null ? formatRate(input.rate, input.unit ?? null) : '';
  const photoBit = photos > 1 ? `${photos} photos` : '';
  const min =
    input.moq != null && input.moq > 0 ? `Min ${input.moq}` : '';
  const meta = [rate, photoBit, min].filter(Boolean).join(' · ');
  const detail = packFeedDetailLine({
    tags: input.categories,
    sourceLine: designShopLine(input.companyName),
  });
  return { meta, detail };
}

export function designSetViewerDetail(input: {
  images: string[];
  companyName: string;
  rate?: number | null;
  unit?: string | null;
  moq?: number | null;
  categories?: string[];
}): string {
  const { meta, detail } = designSetFactLines(input);
  return [meta, detail].filter(Boolean).join(' · ');
}

/** Photos in share order. Next arrow can land on the next design. */
export function designSetSlides(products: DesignSetSlideSource[]): DesignSetSlide[] {
  const slides: DesignSetSlide[] = [];
  for (const product of products) {
    const detail = designSetViewerDetail(product);
    const urls = product.images.map((url) => url.trim()).filter(Boolean);
    if (urls.length === 0) continue;
    for (const url of urls) {
      slides.push({
        url,
        caption: product.name.trim() || 'Design',
        detail,
        productId: product.id,
      });
    }
  }
  return slides;
}

export function firstSlideIndexForProduct(slides: DesignSetSlide[], productId: string): number {
  const index = slides.findIndex((slide) => slide.productId === productId);
  return index < 0 ? 0 : index;
}
