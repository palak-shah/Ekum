import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MasterOptionKind,
  type CollectionView,
  type MasterOptionKind as OptionKind,
  type MasterTaxonomyView,
  type ProductView,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { TagSuggestInput } from './TagSuggestInput';
import { collectUsedTagSlots, filterTagSuggestions } from './tagSuggestionPool';

export function CascadeTagsFields({
  items,
  qualities,
  sizes,
  masterCategoryId,
  onItems,
  onQualities,
  onSizes,
  /** @deprecated Prefer masterCategoryId — kept for callers not yet migrated. */
  parentKeys: _parentKeys,
}: {
  items: string[];
  qualities: string[];
  sizes: string[];
  masterCategoryId?: string | null;
  parentKeys?: string[];
  onItems: (next: string[]) => void;
  onQualities: (next: string[]) => void;
  onSizes: (next: string[]) => void;
}) {
  const queryClient = useQueryClient();
  const taxonomy = useQuery({
    queryKey: ['catalog-master-taxonomy', masterCategoryId],
    queryFn: () =>
      api.get<MasterTaxonomyView>(
        `/catalog/master-taxonomy?categoryId=${encodeURIComponent(masterCategoryId!)}`,
      ),
    enabled: Boolean(masterCategoryId),
    staleTime: 60_000,
  });

  const products = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    staleTime: 60_000,
  });
  const collections = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    staleTime: 60_000,
  });
  const usedSlots = useMemo(
    () => collectUsedTagSlots([...(products.data ?? []), ...(collections.data ?? [])]),
    [products.data, collections.data],
  );

  const itemPool = taxonomy.data?.itemTypes ?? [];
  const qualityPool = taxonomy.data?.qualities ?? [];
  const sizePool = taxonomy.data?.sizes ?? [];

  const persistCustom = (kind: OptionKind, label: string) => {
    void api
      .post('/catalog/custom-tags', {
        kind,
        label,
        masterCategoryId: masterCategoryId ?? null,
      })
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: ['catalog-master-taxonomy', masterCategoryId],
        });
      })
      .catch(() => {
        /* label still stays on the pack; suggestion sync can retry later */
      });
  };

  return (
    <div className="flex flex-col gap-2" data-testid="collection-product-tags">
      <TagSuggestInput
        label="Item tags"
        testId="collection-tag-item"
        values={items}
        onChange={onItems}
        suggestionsFor={(query) => filterTagSuggestions(query, itemPool, usedSlots.items)}
        onCustomCommit={(label) => persistCustom(MasterOptionKind.ItemType, label)}
      />
      <TagSuggestInput
        label="Quality / work tags"
        testId="collection-tag-quality"
        values={qualities}
        onChange={onQualities}
        suggestionsFor={(query) => filterTagSuggestions(query, qualityPool, usedSlots.qualities)}
        onCustomCommit={(label) => persistCustom(MasterOptionKind.Quality, label)}
      />
      <TagSuggestInput
        label="Size tags"
        testId="collection-tag-size"
        values={sizes}
        onChange={onSizes}
        suggestionsFor={(query) => filterTagSuggestions(query, sizePool, usedSlots.sizes)}
        onCustomCommit={(label) => persistCustom(MasterOptionKind.Size, label)}
      />
    </div>
  );
}
