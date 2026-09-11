export type DraftOverrides = {
  category?: string;
  rate?: string;
  unit?: string;
  moq?: string;
  notes?: string;
};

export type SharedDetails = {
  category: string;
  rate: string;
  unit: string;
  moq: string;
  notes: string;
};

/** Same shape as server `generateProductSku` (EK- + 8 hex). */
export function generateDraftSku(random: () => number = Math.random): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(random() * 256);
    }
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `EK-${hex}`;
}

export function uniqueDraftSku(
  existing: string[],
  generate: () => string = generateDraftSku,
): string {
  const taken = new Set(existing.map((s) => s.trim().toUpperCase()));
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const sku = generate();
    if (!taken.has(sku.toUpperCase())) return sku;
  }
  throw new Error('Could not assign a SKU.');
}

export function createProductIdentity(sku: string): { name: string; sku: string } {
  const value = sku.trim();
  return { name: value, sku: value };
}

export function gridHeading(count: number): string {
  return `${count} design${count === 1 ? '' : 's'}`;
}

export function detailsCardTitle(draftCount: number): string {
  return draftCount <= 1 ? 'This design' : 'Same for all designs';
}

export function overridesFromSheet(
  sheet: SharedDetails,
  shared: SharedDetails,
): DraftOverrides {
  const next: DraftOverrides = {};
  if (sheet.category !== shared.category) next.category = sheet.category;
  if (sheet.rate !== shared.rate) next.rate = sheet.rate;
  if (sheet.unit !== shared.unit) next.unit = sheet.unit;
  if (sheet.moq !== shared.moq) next.moq = sheet.moq;
  if (sheet.notes !== shared.notes) next.notes = sheet.notes;
  return next;
}

/** Shots allowed in ContinuousCamera — append-to-design vs new-design session. */
export function continuousCameraMaxShots(input: {
  appendToDraft: boolean;
  draftImageCount: number;
  draftCount: number;
  maxDesigns: number;
  maxPhotosPerDesign: number;
}): number {
  if (input.appendToDraft) {
    return Math.max(0, input.maxPhotosPerDesign - input.draftImageCount);
  }
  return Math.max(0, input.maxDesigns - input.draftCount);
}
