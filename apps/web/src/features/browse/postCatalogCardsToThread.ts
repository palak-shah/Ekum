import type { MessageView } from '@ekum/domain-types';
import { MessageType } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';

export type CatalogCardCollection = {
  collectionId: string;
  name: string;
};

export type CatalogCardProduct = {
  productId: string;
  name: string;
};

/**
 * Posts collection_card / product_card / design_album to a thread.
 * Optional enquireNote lands on the last card so ask + lot are one bubble.
 */
export async function postCatalogCardsToThread(
  threadId: string,
  opts: {
    collections?: CatalogCardCollection[];
    products?: CatalogCardProduct[];
    enquireNote?: string;
  },
): Promise<MessageView[]> {
  const albums = opts.collections ?? [];
  const designs = opts.products ?? [];
  const note = opts.enquireNote?.trim() || '';
  const posted: MessageView[] = [];

  const post = async (body: Record<string, unknown>, withNote: boolean) => {
    const payload =
      withNote && note
        ? { ...body, metadata: { ...(body.metadata as object | undefined), enquireNote: note } }
        : body;
    return api.post<MessageView>(`/threads/${threadId}/messages`, payload);
  };

  const total =
    albums.length + (designs.length >= 2 ? 1 : designs.length);
  let index = 0;

  for (const item of albums) {
    index += 1;
    posted.push(
      await post(
        {
          type: MessageType.CollectionCard,
          referenceId: item.collectionId,
          body: item.name,
        },
        index === total,
      ),
    );
  }
  if (designs.length >= 2) {
    const productIds = designs.map((item) => item.productId);
    index += 1;
    posted.push(
      await post(
        {
          type: MessageType.DesignAlbum,
          metadata: { productIds },
          body: `${productIds.length} designs`,
        },
        index === total,
      ),
    );
    return posted;
  }
  for (const item of designs) {
    index += 1;
    posted.push(
      await post(
        {
          type: MessageType.ProductCard,
          referenceId: item.productId,
          body: item.name,
        },
        index === total,
      ),
    );
  }
  return posted;
}
