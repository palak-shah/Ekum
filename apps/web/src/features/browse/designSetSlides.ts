export type DesignSetSlideSource = {
  id: string;
  name: string;
  images: string[];
  companyName: string;
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

/** Photos in share order. Next arrow can land on the next design. */
export function designSetSlides(products: DesignSetSlideSource[]): DesignSetSlide[] {
  const slides: DesignSetSlide[] = [];
  for (const product of products) {
    const detail = designShopLine(product.companyName);
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
