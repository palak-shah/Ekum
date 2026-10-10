import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import {
  orderItemGalleryCaptions,
  orderItemGalleryDetails,
  orderItemGalleryUrls,
} from './orderItemImages';
import type { TradeListItem } from './tradeList';

export type TradeListGallery = {
  urls: string[];
  captions: string[];
  details: string[];
};

function absolutize(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  return toAbsoluteMediaUrl(trimmed) || trimmed;
}

/** Full swipe set for list PhotoViewer (not only the capped stack). */
export function tradeListGallery(item: TradeListItem): TradeListGallery {
  if (item.kind === 'order') {
    const items = item.order.items ?? [];
    const raw = orderItemGalleryUrls(items);
    const captions = orderItemGalleryCaptions(items);
    const details = orderItemGalleryDetails(items);
    const kept: TradeListGallery = { urls: [], captions: [], details: [] };
    raw.forEach((url, index) => {
      const abs = absolutize(url);
      if (!abs) return;
      kept.urls.push(abs);
      kept.captions.push(captions[index] ?? '');
      kept.details.push(details[index] ?? '');
    });
    return kept;
  }
  if (item.kind === 'complaint') {
    const urls = (item.complaint.images ?? [])
      .map((url) => absolutize(url))
      .filter(Boolean);
    const title = item.complaint.subject?.trim() || 'Photo';
    return {
      urls,
      captions: urls.map(() => title),
      details: urls.map(() => ''),
    };
  }
  return { urls: [], captions: [], details: [] };
}

/** Map a visible stack thumb URL to the gallery index (first match). */
export function tradeListGalleryIndex(galleryUrls: string[], stackUrl: string): number {
  const needle = absolutize(stackUrl);
  if (!needle) return 0;
  const found = galleryUrls.findIndex(
    (url) => url === needle || url === stackUrl.trim(),
  );
  return found >= 0 ? found : 0;
}
