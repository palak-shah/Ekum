import { pickSelectionLabel } from '@/features/browse/albumSelectModel';

/** Sheet title: singular name when one unit; otherwise count copy. */
export function selectionMessageAttachmentTitle(input: {
  collections: ReadonlyArray<{ name: string }>;
  products: ReadonlyArray<{ name: string }>;
}): string {
  const albums = input.collections.length;
  const designs = input.products.length;
  if (albums === 1 && designs === 0) {
    const name = input.collections[0]?.name.trim();
    return name || '1 collection';
  }
  if (designs === 1 && albums === 0) {
    const name = input.products[0]?.name.trim();
    return name || '1 design';
  }
  return pickSelectionLabel(albums, designs);
}
