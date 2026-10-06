import { useQuery } from '@tanstack/react-query';
import {
  CATEGORY_TAXONOMY,
  itemSlotSuggestions,
  mainsForCompany,
  qualitySlotSuggestions,
  sizeSlotSuggestions,
  type TaxonomyMain,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { TagSuggestInput } from './TagSuggestInput';

export function CascadeTagsFields({
  item,
  quality,
  size,
  parentKeys,
  onItem,
  onQuality,
  onSize,
}: {
  item: string;
  quality: string;
  size: string;
  parentKeys: string[];
  onItem: (next: string) => void;
  onQuality: (next: string) => void;
  onSize: (next: string) => void;
}) {
  const taxonomy = useQuery({
    queryKey: ['catalog-taxonomy'],
    queryFn: () => api.get<TaxonomyMain[]>('/catalog/taxonomy'),
    staleTime: 60_000,
  });
  const tree =
    taxonomy.data && taxonomy.data.length > 0 ? taxonomy.data : CATEGORY_TAXONOMY;
  const fromProfile =
    parentKeys.length > 0
      ? parentKeys
          .map(
            (key) =>
              tree.find((main) => main.key === key) ??
              CATEGORY_TAXONOMY.find((main) => main.key === key),
          )
          .filter((main): main is TaxonomyMain => Boolean(main))
      : [];
  const mains =
    fromProfile.length > 0
      ? fromProfile
      : mainsForCompany(parentKeys.length ? parentKeys : tree.map((m) => m.key));
  return (
    <div className="flex flex-col gap-3" data-testid="collection-product-tags">
      <p className="text-sm font-semibold text-ink">Product description</p>
      <TagSuggestInput
        label="Item"
        testId="collection-tag-item"
        value={item}
        onChange={onItem}
        suggestions={itemSlotSuggestions(mains, item)}
        placeholder="Start typing"
      />
      <TagSuggestInput
        label="Quality / work"
        testId="collection-tag-quality"
        value={quality}
        onChange={onQuality}
        suggestions={qualitySlotSuggestions(mains, item, quality)}
        placeholder="Optional"
      />
      <TagSuggestInput
        label="Size"
        testId="collection-tag-size"
        value={size}
        onChange={onSize}
        suggestions={sizeSlotSuggestions(mains, item, quality, size)}
        placeholder="Optional"
      />
    </div>
  );
}
