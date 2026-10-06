/**
 * Official EKUM Category Drill-Down (Main → Sub → Item + Size / Quality).
 * Transcribed from the client sheet; unreadable size cells are omitted (not invented).
 */
import { SuperCategory, Unit } from './enums';

export const APPAREL_SIZES = [
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  '5XL',
  'Free Size',
] as const;

const WOMENS_QUALITY = [
  'Cotton',
  'Rayon',
  'Georgette',
  'Chiffon',
  'Silk',
  'Crepe',
  'Linen',
  'Printed',
  'Embroidered',
  'Sequence',
  'Mirror',
  'Bandhani',
  'Tie Dye',
];

const HOME_SIZES = ['Single', 'Double', 'Queen', 'King', 'Custom'];
const HOME_QUALITY = [
  'Cotton',
  'Microfiber',
  'Satin',
  'Linen',
  'Bamboo',
  'Printed',
  'Embroidered',
  'Jacquard',
];

const FABRIC_SIZES = ['3M', '4M', '5.5M', 'Than', 'Custom'];
const FABRIC_QUALITY = ['Plain', 'Printed', 'Yarn-dyed', 'Dobby', 'Jacquard'];

export type TaxonomyItem = {
  label: string;
  sizes?: string[];
  qualities?: string[];
  standardSetSize?: number;
};

export type TaxonomySub = {
  label: string;
  items: TaxonomyItem[];
};

export type TaxonomyMain = {
  key: string;
  orderUnit: typeof Unit.Set | typeof Unit.Dozen;
  dispatchUnit: typeof Unit.Piece | typeof Unit.Metre;
  /** Extra dispatch choices when the sheet lists more than one. */
  dispatchUnitAlt?: Array<typeof Unit.Piece | typeof Unit.Metre>;
  subs: TaxonomySub[];
};

function apparelItems(labels: string[]): TaxonomyItem[] {
  return labels.map((label) => ({
    label,
    sizes: [...APPAREL_SIZES],
    qualities: [...WOMENS_QUALITY],
    standardSetSize: 1,
  }));
}

export const CATEGORY_TAXONOMY: TaxonomyMain[] = [
  {
    key: 'HOME TEXTILES',
    orderUnit: Unit.Set,
    dispatchUnit: Unit.Piece,
    dispatchUnitAlt: [Unit.Metre],
    subs: [
      {
        label: 'Bed Linen',
        items: ['Bedsheet', 'Comforter Set', 'Dohar', 'Duvet Cover'].map((label) => ({
          label,
          sizes: HOME_SIZES,
          qualities: HOME_QUALITY,
          standardSetSize: 1,
        })),
      },
      {
        label: 'Bath Linen',
        items: [
          {
            label: 'Towels',
            sizes: HOME_SIZES,
            qualities: HOME_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Curtains',
        items: ['Door Curtain', 'Window Curtain'].map((label) => ({
          label,
          sizes: HOME_SIZES,
          qualities: HOME_QUALITY,
          standardSetSize: 1,
        })),
      },
    ],
  },
  {
    key: 'WOMENS WEAR',
    orderUnit: Unit.Set,
    dispatchUnit: Unit.Piece,
    subs: [
      {
        label: 'Readymade',
        items: apparelItems([
          '1 Pc Kurti',
          '2 Pcs Kurti',
          '3 Pcs Kurti',
          'Coord Set',
          'Saree (with stitched blouse)',
          'Chaniya Choli',
          'Nighty',
          'Leggings / Bottomwear',
          'Pant',
          'Bermuda / Shorts',
          'Shirt',
          'Tshirt',
          'Jodi (Set)',
          'MM - Top/Bottom',
          'MM - Top/Bottom/Dupatta',
        ]),
      },
      {
        label: 'Unstitched',
        items: [
          'Kurti / Suit Piece (cut-piece)',
          'Saree Blouse Piece',
          'Salwar Suit Set (3-piece cut)',
        ].map((label) => ({
          label,
          sizes: [...APPAREL_SIZES],
          qualities: [...WOMENS_QUALITY],
          standardSetSize: 1,
        })),
      },
    ],
  },
  {
    key: 'MENS WEAR',
    orderUnit: Unit.Set,
    dispatchUnit: Unit.Piece,
    subs: [
      {
        label: 'Topwear',
        items: apparelItems(['Shirt', 'Tshirt']),
      },
      {
        label: 'Bottomwear',
        items: apparelItems(['Pant', 'Bermuda / Shorts']),
      },
      {
        label: 'Ethnic',
        items: apparelItems(['Kurta']),
      },
    ],
  },
  {
    key: 'KIDS WEAR',
    orderUnit: Unit.Set,
    dispatchUnit: Unit.Piece,
    subs: [
      {
        label: 'Kids Topwear',
        items: apparelItems(['Shirt', 'Tshirt']),
      },
      {
        label: 'Kids Bottomwear',
        items: apparelItems(['Pant']),
      },
      {
        label: 'Kids Ethnic',
        items: apparelItems(['Kurta']),
      },
    ],
  },
  {
    key: 'FABRICS',
    orderUnit: Unit.Set,
    dispatchUnit: Unit.Metre,
    subs: [
      {
        label: 'Suiting',
        items: [
          {
            label: 'Suiting Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Shirting',
        items: [
          {
            label: 'Shirting Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Rayon',
        items: [
          {
            label: 'Rayon Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'PC (Poly-Cotton)',
        items: [
          {
            label: 'PC Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Cambric',
        items: [
          {
            label: 'Cambric Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Denim',
        items: [
          {
            label: 'Denim Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Hosiery',
        items: [
          {
            label: 'Hosiery Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Patta',
        items: [
          {
            label: 'Patta / Border Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Cotton',
        items: [
          {
            label: 'Cotton Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
      {
        label: 'Trade-Name Fabric',
        items: [
          {
            label: 'Trade-Name Fabric',
            sizes: FABRIC_SIZES,
            qualities: FABRIC_QUALITY,
            standardSetSize: 1,
          },
        ],
      },
    ],
  },
  {
    key: 'ACCESSORIES',
    orderUnit: Unit.Set,
    dispatchUnit: Unit.Piece,
    dispatchUnitAlt: [Unit.Piece],
    subs: [
      {
        label: 'Ready Made',
        items: ['Rugs', 'Bags', 'Belts'].map((label) => ({
          label,
          sizes: ['Free Size', 'Custom'],
          qualities: ['Leather', 'Fabric', 'Metal', 'Printed'],
          standardSetSize: 1,
        })),
      },
    ],
  },
];

export const SUPER_TO_TAXONOMY_PARENT: Record<string, string> = {
  [SuperCategory.HomeFurnishing]: 'HOME TEXTILES',
  [SuperCategory.WomensApparel]: 'WOMENS WEAR',
  [SuperCategory.MensApparel]: 'MENS WEAR',
  [SuperCategory.Accessories]: 'ACCESSORIES',
};

const PARENT_ALIASES: Record<string, string> = {
  'home textiles': 'HOME TEXTILES',
  'home furnishing': 'HOME TEXTILES',
  'home furnishings': 'HOME TEXTILES',
  'womens wear': 'WOMENS WEAR',
  "women's wear": 'WOMENS WEAR',
  'womens apparel': 'WOMENS WEAR',
  "women's apparel": 'WOMENS WEAR',
  'mens wear': 'MENS WEAR',
  "men's wear": 'MENS WEAR',
  'mens apparel': 'MENS WEAR',
  "men's apparel": 'MENS WEAR',
  fabrics: 'FABRICS',
  fabric: 'FABRICS',
  accessories: 'ACCESSORIES',
  'kids wear': 'KIDS WEAR',
  "kid's wear": 'KIDS WEAR',
  kidswear: 'KIDS WEAR',
};

const ALL_PARENT_KEYS = CATEGORY_TAXONOMY.map((m) => m.key);

export function parentKeysFromCompanyCategories(
  sellCategories: string[],
  superCategories: string[],
): string[] {
  const keys = new Set<string>();
  for (const raw of superCategories) {
    const mapped = SUPER_TO_TAXONOMY_PARENT[raw];
    if (mapped) keys.add(mapped);
  }
  for (const raw of sellCategories) {
    const needle = raw.trim().toLowerCase();
    if (!needle) continue;
    const alias = PARENT_ALIASES[needle];
    if (alias) {
      keys.add(alias);
      continue;
    }
    for (const parent of ALL_PARENT_KEYS) {
      if (parent.toLowerCase() === needle) keys.add(parent);
    }
  }
  return [...keys];
}

export function mainsForCompany(parentKeys: string[]): TaxonomyMain[] {
  if (parentKeys.length === 0) return CATEGORY_TAXONOMY;
  const byKey = new Map(CATEGORY_TAXONOMY.map((m) => [m.key, m]));
  const matched = parentKeys
    .map((key) => byKey.get(key))
    .filter((main): main is TaxonomyMain => Boolean(main));
  return matched.length > 0 ? matched : CATEGORY_TAXONOMY;
}

export type OfficialTagSeed = { parentKey: string; label: string };

/** Flatten sub, item, size, and quality labels for CatalogTag search. */
export function flattenOfficialTagSeeds(): OfficialTagSeed[] {
  const out: OfficialTagSeed[] = [];
  const seen = new Set<string>();
  const push = (parentKey: string, label: string) => {
    const key = `${parentKey}::${label.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ parentKey, label });
  };
  for (const main of CATEGORY_TAXONOMY) {
    for (const sub of main.subs) {
      push(main.key, sub.label);
      for (const item of sub.items) {
        push(main.key, item.label);
        for (const size of item.sizes ?? []) push(main.key, size);
        for (const quality of item.qualities ?? []) push(main.key, quality);
      }
    }
  }
  return out;
}

function filterLabels(pool: string[], query: string, limit?: number): string[] {
  const q = query.trim().toLowerCase();
  const cap = limit ?? (q ? 12 : 40);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const label of pool) {
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(label);
  }
  if (!q) return unique.slice(0, cap);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const label of unique) {
    const lower = label.toLowerCase();
    if (lower.startsWith(q)) starts.push(label);
    else if (lower.includes(q)) contains.push(label);
  }
  return [...starts, ...contains].slice(0, cap);
}

function findSub(mains: TaxonomyMain[], label: string): TaxonomySub | null {
  const needle = label.trim().toLowerCase();
  if (!needle) return null;
  for (const main of mains) {
    for (const sub of main.subs) {
      if (sub.label.toLowerCase() === needle) return sub;
    }
  }
  return null;
}

function findItem(mains: TaxonomyMain[], label: string): TaxonomyItem | null {
  const needle = label.trim().toLowerCase();
  if (!needle) return null;
  for (const main of mains) {
    for (const sub of main.subs) {
      for (const item of sub.items) {
        if (item.label.toLowerCase() === needle) return item;
      }
    }
  }
  return null;
}

export function isOfficialSubOrItem(mains: TaxonomyMain[], label: string): boolean {
  return Boolean(findSub(mains, label) || findItem(mains, label));
}

export function itemSlotSuggestions(mains: TaxonomyMain[], query: string): string[] {
  const perMain = mains.map((main) => {
    const labels: string[] = [];
    for (const sub of main.subs) {
      labels.push(sub.label);
      for (const item of sub.items) labels.push(item.label);
    }
    return labels;
  });
  const pool: string[] = [];
  if (!query.trim()) {
    let index = 0;
    let more = true;
    while (more) {
      more = false;
      for (const labels of perMain) {
        const next = labels[index];
        if (next) {
          pool.push(next);
          more = true;
        }
      }
      index += 1;
    }
  } else {
    for (const labels of perMain) pool.push(...labels);
  }
  return filterLabels(pool, query);
}

export function qualitySlotSuggestions(
  mains: TaxonomyMain[],
  item: string,
  query: string,
): string[] {
  const pool: string[] = [];
  const sub = findSub(mains, item);
  const leaf = findItem(mains, item);
  if (sub) {
    for (const row of sub.items) pool.push(row.label);
    for (const row of sub.items) pool.push(...(row.qualities ?? []));
  } else if (leaf) {
    pool.push(...(leaf.qualities ?? []));
  } else {
    for (const main of mains) {
      for (const group of main.subs) {
        for (const row of group.items) pool.push(row.label);
      }
    }
    for (const main of mains) {
      for (const group of main.subs) {
        for (const row of group.items) pool.push(...(row.qualities ?? []));
      }
    }
  }
  return filterLabels(pool, query);
}

export function sizeSlotSuggestions(
  mains: TaxonomyMain[],
  item: string,
  quality: string,
  query: string,
): string[] {
  const qualityItem = findItem(mains, quality);
  const itemLeaf = findItem(mains, item);
  const sub = findSub(mains, item);
  let pool: string[] = [];
  if (qualityItem?.sizes?.length) pool = [...qualityItem.sizes];
  else if (itemLeaf?.sizes?.length) pool = [...itemLeaf.sizes];
  else if (sub) {
    const seen = new Set<string>();
    for (const row of sub.items) {
      for (const size of row.sizes ?? []) {
        if (seen.has(size.toLowerCase())) continue;
        seen.add(size.toLowerCase());
        pool.push(size);
      }
    }
  } else {
    const seen = new Set<string>();
    for (const main of mains) {
      for (const group of main.subs) {
        for (const row of group.items) {
          for (const size of row.sizes ?? []) {
            if (seen.has(size.toLowerCase())) continue;
            seen.add(size.toLowerCase());
            pool.push(size);
          }
        }
      }
    }
  }
  return filterLabels(pool, query);
}

export function unitsSuggestedByItem(
  mains: TaxonomyMain[],
  item: string,
): { orderUnit: string; dispatchUnit: string; piecesPerPack: number | null } | null {
  const needle = item.trim().toLowerCase();
  if (!needle) return null;
  for (const main of mains) {
    for (const sub of main.subs) {
      if (sub.label.toLowerCase() === needle) {
        return {
          orderUnit: main.orderUnit,
          dispatchUnit: main.dispatchUnit,
          piecesPerPack: sub.items[0]?.standardSetSize ?? 1,
        };
      }
      for (const row of sub.items) {
        if (row.label.toLowerCase() === needle) {
          return {
            orderUnit: main.orderUnit,
            dispatchUnit: main.dispatchUnit,
            piecesPerPack: row.standardSetSize ?? 1,
          };
        }
      }
    }
  }
  return null;
}

export type TagSlots = {
  items: string[];
  qualities: string[];
  size: string;
};

export function emptyTagSlots(): TagSlots {
  return { items: [], qualities: [], size: '' };
}

function labelKeySet(labels: Iterable<string>): Set<string> {
  const set = new Set<string>();
  for (const label of labels) {
    const key = label.trim().toLowerCase();
    if (key) set.add(key);
  }
  return set;
}

function allItemLabels(mains: TaxonomyMain[]): Set<string> {
  const labels: string[] = [];
  for (const main of mains) {
    for (const sub of main.subs) {
      labels.push(sub.label);
      for (const row of sub.items) labels.push(row.label);
    }
  }
  return labelKeySet(labels);
}

function allQualityLabels(mains: TaxonomyMain[]): Set<string> {
  const labels: string[] = [];
  for (const main of mains) {
    for (const sub of main.subs) {
      for (const row of sub.items) labels.push(...(row.qualities ?? []));
    }
  }
  return labelKeySet(labels);
}

function allSizeLabels(mains: TaxonomyMain[]): Set<string> {
  const labels: string[] = [];
  for (const main of mains) {
    for (const sub of main.subs) {
      for (const row of sub.items) labels.push(...(row.sizes ?? []));
    }
  }
  return labelKeySet(labels);
}

export function tagSlotsToCategories(slots: TagSlots): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...slots.items, ...slots.qualities, slots.size]) {
    const label = raw.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** Official item/sub → Item tags; official quality-only → Quality / work; official size → Size; custom → Item tags. */
export function categoriesToTagSlots(
  categories: string[],
  mains: TaxonomyMain[] = CATEGORY_TAXONOMY,
): TagSlots {
  const itemKeys = allItemLabels(mains);
  const qualityKeys = allQualityLabels(mains);
  const sizeKeys = allSizeLabels(mains);
  const items: string[] = [];
  const qualities: string[] = [];
  let size = '';
  for (const raw of categories) {
    const label = raw.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (!size && sizeKeys.has(key)) {
      size = label;
      continue;
    }
    if (itemKeys.has(key)) {
      items.push(label);
      continue;
    }
    if (qualityKeys.has(key)) {
      qualities.push(label);
      continue;
    }
    items.push(label);
  }
  return { items, qualities, size };
}
