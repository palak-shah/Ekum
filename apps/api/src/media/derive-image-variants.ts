import { MEDIA_VARIANT_MAX_EDGE } from '@ekum/domain-types';

/** Sharp WebP siblings used by `media.thumbnail` and seed catalog. */
export async function deriveImageVariants(
  input: Buffer,
): Promise<{ thumbnail1: Buffer; thumbnail2: Buffer }> {
  const sharp = (await import('sharp')).default;
  const base = sharp(input, { limitInputPixels: true }).rotate();
  const thumbnail1 = await base
    .clone()
    .resize(MEDIA_VARIANT_MAX_EDGE.thumbnail1, MEDIA_VARIANT_MAX_EDGE.thumbnail1, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbnail2 = await base
    .clone()
    .resize(MEDIA_VARIANT_MAX_EDGE.thumbnail2, MEDIA_VARIANT_MAX_EDGE.thumbnail2, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  return { thumbnail1, thumbnail2 };
}
