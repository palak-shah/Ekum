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

function uniqueLabels(groups: string[][]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const label of group) {
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(label);
    }
  }
  return out;
}

export function CascadeTagsFields({
  items,
  qualities,
  size,
  parentKeys,
  onItems,
  onQualities,
  onSize,
}: {
  items: string[];
  qualities: string[];
  size: string;
  parentKeys: string[];
  onItems: (next: string[]) => void;
  onQualities: (next: string[]) => void;
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
  const itemKeys = items.length > 0 ? items : [''];
  const qualityKeys = qualities.length > 0 ? qualities : [''];
  return (
    <div className="flex flex-col gap-3" data-testid="collection-product-tags">
      <p className="text-sm font-semibold text-ink">Product description</p>
      <TagSuggestInput
        label="Item tags"
        testId="collection-tag-item"
        values={items}
        onChange={onItems}
        suggestionsFor={(query) => itemSlotSuggestions(mains, query)}
        placeholder="Start typing"
      />
      <TagSuggestInput
        label="Quality / work tags"
        testId="collection-tag-quality"
        values={qualities}
        onChange={onQualities}
        suggestionsFor={(query) =>
          uniqueLabels(itemKeys.map((item) => qualitySlotSuggestions(mains, item, query)))
        }
        placeholder="Optional"
      />
      <TagSuggestInput
        label="Size"
        testId="collection-tag-size"
        multiple={false}
        values={size ? [size] : []}
        onChange={(next) => onSize(next[0] ?? '')}
        suggestionsFor={(query) =>
          uniqueLabels(
            itemKeys.flatMap((item) =>
              qualityKeys.map((quality) => sizeSlotSuggestions(mains, item, quality, query)),
            ),
          )
        }
        placeholder="Optional"
      />
    </div>
  );
}
