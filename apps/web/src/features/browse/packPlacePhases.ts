import { packHandlerName, collectionIdForPackOrder } from '@/features/browse/packOrderSource';

export type PackPlaceLine = {
  productId?: string;
  companyId: string;
  companyName?: string | null;
  sourceDirect?: boolean;
  sourcePath?: 'direct' | 'handle';
  sourceCollectionId?: string;
  sourceHandlerCompanyId?: string;
  sourceHandlerName?: string;
};

export function isDirectPackLine(entry: {
  sourceDirect?: boolean;
  sourcePath?: 'direct' | 'handle';
}): boolean {
  if (entry.sourceDirect === true) return true;
  return entry.sourcePath === 'direct';
}

export function stampPackMillRoute(input: {
  millCompanyId: string;
  packOwnerCompanyId?: string | null;
  directMillCompanyIds?: readonly string[] | null;
}): { sourcePath: 'direct' | 'handle'; sourceDirect: boolean } {
  const owner = input.packOwnerCompanyId?.trim();
  const mill = input.millCompanyId.trim();
  const isForeign = Boolean(owner && mill && mill !== owner);
  const sourceDirect =
    isForeign && (input.directMillCompanyIds ?? []).includes(mill);
  return {
    sourceDirect,
    sourcePath: sourceDirect ? 'direct' : 'handle',
  };
}

export function packPlaceDirectEntries<T extends PackPlaceLine>(entries: T[]): T[] {
  return entries.filter((entry) => isDirectPackLine(entry));
}

export function packPlaceHandleEntries<T extends PackPlaceLine>(entries: T[]): T[] {
  return entries.filter((entry) => !isDirectPackLine(entry));
}

/** Direct mill lines first; otherwise the I-handle remainder (one parent). */
export function packPlaceWaveEntries<T extends PackPlaceLine>(entries: T[]): T[] {
  const direct = packPlaceDirectEntries(entries);
  if (direct.length > 0) return direct;
  return entries;
}

export function packPlaceGoesToName(entries: PackPlaceLine[]): string | null {
  const wave = packPlaceWaveEntries(entries);
  if (wave.length === 0) return null;
  if (wave.every(isDirectPackLine)) {
    const names = [
      ...new Set(wave.map((row) => row.companyName?.trim()).filter(Boolean)),
    ];
    return names.length === 1 ? names[0]! : null;
  }
  return packHandlerName(wave);
}

/** Direct wave = mill shop / multi; I-handle wave = pack owner (never mill names). */
export function packPlaceGoesToSellerId(entries: PackPlaceLine[]): string {
  const wave = packPlaceWaveEntries(entries);
  if (wave.length === 0) return 'multi';
  if (wave.every(isDirectPackLine)) {
    const first = wave[0]!.companyId;
    return wave.every((entry) => entry.companyId === first) ? first : 'multi';
  }
  if (collectionIdForPackOrder(wave)) {
    const ids = [
      ...new Set(
        wave
          .map((row) => row.sourceHandlerCompanyId?.trim())
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (ids.length === 1) return ids[0]!;
  }
  const first = wave[0]!.companyId;
  return wave.every((entry) => entry.companyId === first) ? first : 'multi';
}

export function forBuyerPlaceSubsets<T extends { companyId?: string | null }>(
  lines: T[],
  input: {
    actorCompanyId?: string | null;
    directMillCompanyIds: readonly string[];
  },
): { direct: T[]; handle: T[] } {
  const directMills = new Set(input.directMillCompanyIds);
  const actor = input.actorCompanyId?.trim();
  const direct: T[] = [];
  const handle: T[] = [];
  for (const line of lines) {
    const mill = line.companyId?.trim();
    if (mill && mill !== actor && directMills.has(mill)) {
      direct.push(line);
    } else {
      handle.push(line);
    }
  }
  return { direct, handle };
}
