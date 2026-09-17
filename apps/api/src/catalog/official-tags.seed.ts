/**
 * Official catalog tags from EKUM Category Drill-Down taxonomy.
 * Labels = Sub Category + Product/Item Type; parentKey = Main Category.
 * Idempotent upsert via stable seed ids — safe to re-run from db:seed.
 */
import type { PrismaClient } from '@prisma/client';

export type OfficialTagSeed = { parentKey: string; label: string };

export const OFFICIAL_TAG_SEEDS: OfficialTagSeed[] = [
  { parentKey: "HOME TEXTILES", label: "Bed Linen" },
  { parentKey: "HOME TEXTILES", label: "Bedsheet" },
  { parentKey: "HOME TEXTILES", label: "Comforter Set" },
  { parentKey: "HOME TEXTILES", label: "Dohar" },
  { parentKey: "HOME TEXTILES", label: "Duvet Cover" },
  { parentKey: "HOME TEXTILES", label: "Bath Linen" },
  { parentKey: "HOME TEXTILES", label: "Towels" },
  { parentKey: "HOME TEXTILES", label: "Curtains" },
  { parentKey: "HOME TEXTILES", label: "Door Curtain" },
  { parentKey: "HOME TEXTILES", label: "Window Curtain" },
  { parentKey: "WOMENS WEAR", label: "Readymade" },
  { parentKey: "WOMENS WEAR", label: "1 Pc Kurti" },
  { parentKey: "WOMENS WEAR", label: "2 Pcs Kurti" },
  { parentKey: "WOMENS WEAR", label: "3 Pcs Kurti" },
  { parentKey: "WOMENS WEAR", label: "Coord Set" },
  { parentKey: "WOMENS WEAR", label: "Saree (with stitched blouse)" },
  { parentKey: "WOMENS WEAR", label: "Chaniya Choli" },
  { parentKey: "WOMENS WEAR", label: "Nighty" },
  { parentKey: "WOMENS WEAR", label: "Leggings / Bottomwear" },
  { parentKey: "WOMENS WEAR", label: "Pant" },
  { parentKey: "WOMENS WEAR", label: "Bermuda / Shorts" },
  { parentKey: "WOMENS WEAR", label: "Shirt" },
  { parentKey: "WOMENS WEAR", label: "Tshirt" },
  { parentKey: "WOMENS WEAR", label: "Jodi (Set)" },
  { parentKey: "WOMENS WEAR", label: "MM - Top/Bottom" },
  { parentKey: "WOMENS WEAR", label: "MM - Top/Bottom/Dupatta" },
  { parentKey: "WOMENS WEAR", label: "Unstitched" },
  { parentKey: "WOMENS WEAR", label: "Kurti / Suit Piece (cut-piece)" },
  { parentKey: "WOMENS WEAR", label: "Saree Blouse Piece" },
  { parentKey: "WOMENS WEAR", label: "Salwar Suit Set (3-piece cut)" },
  { parentKey: "MENS WEAR", label: "Topwear" },
  { parentKey: "MENS WEAR", label: "Shirt" },
  { parentKey: "MENS WEAR", label: "Tshirt" },
  { parentKey: "MENS WEAR", label: "Bottomwear" },
  { parentKey: "MENS WEAR", label: "Pant" },
  { parentKey: "MENS WEAR", label: "Bermuda / Shorts" },
  { parentKey: "MENS WEAR", label: "Ethnic" },
  { parentKey: "MENS WEAR", label: "Kurta" },
  { parentKey: "FABRICS", label: "Suiting" },
  { parentKey: "FABRICS", label: "Suiting Fabric" },
  { parentKey: "FABRICS", label: "Shirting" },
  { parentKey: "FABRICS", label: "Shirting Fabric" },
  { parentKey: "FABRICS", label: "Rayon" },
  { parentKey: "FABRICS", label: "Rayon Fabric" },
  { parentKey: "FABRICS", label: "PC (Poly-Cotton)" },
  { parentKey: "FABRICS", label: "PC Fabric" },
  { parentKey: "FABRICS", label: "Cambric" },
  { parentKey: "FABRICS", label: "Cambric Fabric" },
  { parentKey: "FABRICS", label: "Denim" },
  { parentKey: "FABRICS", label: "Denim Fabric" },
  { parentKey: "FABRICS", label: "Hosiery" },
  { parentKey: "FABRICS", label: "Hosiery Fabric" },
  { parentKey: "FABRICS", label: "Patta" },
  { parentKey: "FABRICS", label: "Patta / Border Fabric" },
  { parentKey: "FABRICS", label: "Cotton" },
  { parentKey: "FABRICS", label: "Cotton Fabric" },
  { parentKey: "FABRICS", label: "Trade-Name Fabric" },
  { parentKey: "ACCESSORIES", label: "Ready Made" },
  { parentKey: "ACCESSORIES", label: "Rugs" },
  { parentKey: "ACCESSORIES", label: "Bags" },
  { parentKey: "ACCESSORIES", label: "Belts" },
  { parentKey: "KIDS WEAR", label: "Kids Topwear" },
  { parentKey: "KIDS WEAR", label: "Shirt" },
  { parentKey: "KIDS WEAR", label: "Tshirt" },
  { parentKey: "KIDS WEAR", label: "Kids Bottomwear" },
  { parentKey: "KIDS WEAR", label: "Pant" },
  { parentKey: "KIDS WEAR", label: "Kids Ethnic" },
  { parentKey: "KIDS WEAR", label: "Kurta" },
];

function seedId(parentKey: string, label: string): string {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
  return `seed-tag-${slug(parentKey)}-${slug(label)}`;
}

/** Upsert all official taxonomy tags. Safe to call repeatedly. */
export async function seedOfficialCatalogTags(prisma: PrismaClient): Promise<number> {
  let n = 0;
  for (const row of OFFICIAL_TAG_SEEDS) {
    const id = seedId(row.parentKey, row.label);
    await prisma.catalogTag.upsert({
      where: { id },
      create: {
        id,
        scope: 'official',
        companyId: null,
        label: row.label,
        parentKey: row.parentKey,
        status: 'verified',
      },
      update: {
        label: row.label,
        parentKey: row.parentKey,
        scope: 'official',
        status: 'verified',
        companyId: null,
      },
    });
    n += 1;
  }
  return n;
}
