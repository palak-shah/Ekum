import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { MEDIA_VARIANT, type MediaVariant } from '@ekum/domain-types';
import { mediaDisplayUrl, toAbsoluteMediaUrl } from '@/lib/mediaUrl';

export type ManagedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  /** thumbnail1 = lists / 48px; thumbnail2 = feed / carousel; original = PhotoViewer only. */
  variant?: MediaVariant;
};

/**
 * Requests the matching WebP sibling. One onError falls back to the original URL.
 * Missing thumbs (failed job, leftover blobs) still show the photo.
 */
export function ManagedImage({
  src,
  variant = MEDIA_VARIANT.Thumbnail1,
  onError,
  ...rest
}: ManagedImageProps) {
  const original = toAbsoluteMediaUrl(src);
  const preferred = mediaDisplayUrl(src, variant);
  const [current, setCurrent] = useState(preferred);

  useEffect(() => {
    setCurrent(mediaDisplayUrl(src, variant));
  }, [src, variant]);

  return (
    <img
      {...rest}
      src={current}
      onError={(event) => {
        if (current !== original && original) {
          setCurrent(original);
          return;
        }
        onError?.(event);
      }}
    />
  );
}
