/**
 * Spreadsheet Master Categories (Section A) and related option kinds.
 * Stable slugs are IDs on the wire and in Company.masterCategories.
 */
import { z } from 'zod';
import { Unit } from './enums';

export const MasterOptionKind = {
  ItemType: 'item_type',
  Quality: 'quality',
  Size: 'size',
} as const;
export type MasterOptionKind = (typeof MasterOptionKind)[keyof typeof MasterOptionKind];
export const masterOptionKindValues = [
  MasterOptionKind.ItemType,
  MasterOptionKind.Quality,
  MasterOptionKind.Size,
] as const;

export const MasterCategorySlug = {
  HomeTextilesReadyset: 'hometextiles_readyset',
  HomeTextilesFabric: 'hometextiles_fabric',
  WomensReadymadeEthnic: 'womens_readymade_ethnic',
  WomensReadymadeWestern: 'womens_readymade_western',
  WomensUnstitched: 'womens_unstitched',
  MensReadymadeEthnic: 'mens_readymade_ethnic',
  MensReadymadeWestern: 'mens_readymade_western',
  FabricsShirtingSuiting: 'fabrics_shirting_suiting',
  FabricsDressMaterial: 'fabrics_dress_material',
  KidsReadymadeWestern: 'kids_readymade_western',
  KidsReadymadeEthnic: 'kids_readymade_ethnic',
  AccessoriesReadymade: 'accessories_readymade',
  Jobwork: 'jobwork',
} as const;
export type MasterCategorySlug =
  (typeof MasterCategorySlug)[keyof typeof MasterCategorySlug];

export const masterCategorySlugValues = Object.values(MasterCategorySlug) as [
  MasterCategorySlug,
  ...MasterCategorySlug[],
];

/** Trader-facing chip labels (never show raw slugs). */
export const MASTER_CATEGORY_LABEL: Record<MasterCategorySlug, string> = {
  [MasterCategorySlug.HomeTextilesReadyset]: 'Home textiles – Readyset',
  [MasterCategorySlug.HomeTextilesFabric]: 'Home textiles – Fabric',
  [MasterCategorySlug.WomensReadymadeEthnic]: 'Womens – Readymade – Ethnic',
  [MasterCategorySlug.WomensReadymadeWestern]: 'Womens – Readymade – Western',
  [MasterCategorySlug.WomensUnstitched]: 'Womens – Unstitched',
  [MasterCategorySlug.MensReadymadeEthnic]: 'Mens – Readymade – Ethnic',
  [MasterCategorySlug.MensReadymadeWestern]: 'Mens – Readymade – Western',
  [MasterCategorySlug.FabricsShirtingSuiting]: 'Fabrics – Shirting & Suiting',
  [MasterCategorySlug.FabricsDressMaterial]: 'Fabrics – Dress material',
  [MasterCategorySlug.KidsReadymadeWestern]: 'Kids – Readymade – Western',
  [MasterCategorySlug.KidsReadymadeEthnic]: 'Kids – Readymade – Ethnic',
  [MasterCategorySlug.AccessoriesReadymade]: 'Accessories – Readymade',
  [MasterCategorySlug.Jobwork]: 'Jobwork',
};

const MASTER_SLUG_SET = new Set<string>(masterCategorySlugValues);

export function masterCategoryDisplayLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (MASTER_SLUG_SET.has(trimmed)) {
    return MASTER_CATEGORY_LABEL[trimmed as MasterCategorySlug];
  }
  if (trimmed.includes('_')) {
    return trimmed
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  return trimmed;
}

/** Legacy SuperCategory → Master Category slugs (migration / interest bridge). */
export const SUPER_TO_MASTER_CATEGORIES: Record<string, MasterCategorySlug[]> = {
  mens_apparel: [
    MasterCategorySlug.MensReadymadeEthnic,
    MasterCategorySlug.MensReadymadeWestern,
  ],
  womens_apparel: [
    MasterCategorySlug.WomensReadymadeEthnic,
    MasterCategorySlug.WomensReadymadeWestern,
    MasterCategorySlug.WomensUnstitched,
  ],
  home_furnishing: [
    MasterCategorySlug.HomeTextilesReadyset,
    MasterCategorySlug.HomeTextilesFabric,
  ],
  accessories: [MasterCategorySlug.AccessoriesReadymade],
  others: [],
};

export function migrateSuperCategoriesToMaster(
  supers: string[],
): MasterCategorySlug[] {
  const out = new Set<MasterCategorySlug>();
  for (const raw of supers) {
    const mapped = SUPER_TO_MASTER_CATEGORIES[raw];
    if (mapped) {
      for (const slug of mapped) out.add(slug);
      continue;
    }
    if (MASTER_SLUG_SET.has(raw)) out.add(raw as MasterCategorySlug);
  }
  return [...out];
}

/** Sheet unit tokens → Ekum Unit enum. */
export function sheetUnitToUnit(token: string): Unit | null {
  const t = token.trim().toUpperCase();
  if (t === 'PCS' || t === 'PC') return Unit.Piece;
  if (t === 'DOZEN') return Unit.Dozen;
  if (t === 'SET') return Unit.Set;
  if (t === 'MTR') return Unit.Metre;
  if (t === 'KGS' || t === 'KG') return Unit.Kilogram;
  return null;
}

export interface MasterCategoryView {
  id: string;
  slug: string;
  label: string;
  active: boolean;
  sortOrder: number;
}

export interface MasterTaxonomyView {
  category: MasterCategoryView;
  itemTypes: string[];
  qualities: string[];
  sizes: string[];
  units: string[];
}

export const createCompanyCustomTagSchema = z.object({
  label: z.string().trim().min(1).max(80),
  kind: z.enum(masterOptionKindValues),
  masterCategoryId: z.string().min(1).optional().nullable(),
});
export type CreateCompanyCustomTagDto = z.infer<typeof createCompanyCustomTagSchema>;

export interface CompanyCustomTagView {
  id: string;
  companyId: string;
  kind: string;
  label: string;
  masterCategoryId: string | null;
  createdAt: string;
}
