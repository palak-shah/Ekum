import { CollectionKind } from '@ekum/domain-types';
import { isCatalogCollection } from './youLibraryKind';

/** User-facing pack noun. Catalog never reads as collection. */
export function packNoun(kind?: string | null): 'catalog' | 'collection' {
  return isCatalogCollection(kind) ? 'catalog' : 'collection';
}

export function packNounCap(kind?: string | null): 'Catalog' | 'Collection' {
  return isCatalogCollection(kind) ? 'Catalog' : 'Collection';
}

export function thisPack(kind?: string | null): string {
  return `this ${packNoun(kind)}`;
}

export function packNameLabel(kind?: string | null): string {
  return `${packNounCap(kind)} name`;
}

export function enterPackNameError(kind?: string | null): string {
  return `Enter a ${packNoun(kind)} name.`;
}

export function couldNotLoadThisPack(kind?: string | null): string {
  return `Could not load ${thisPack(kind)}.`;
}

export function loadingPackLabel(kind?: string | null): string {
  return `Loading ${packNoun(kind)}…`;
}

export function missingPackError(kind?: string | null): string {
  return `Missing ${packNoun(kind)}`;
}

export function newPackTitle(kind?: string | null): string {
  return `New ${packNoun(kind)}`;
}

export function editPackTitle(kind?: string | null): string {
  return `Edit ${packNoun(kind)}`;
}

export function updatePackLabel(kind?: string | null): string {
  return `Update ${packNoun(kind)}`;
}

export function editPackDetailsLabel(kind?: string | null): string {
  return `Edit ${packNoun(kind)} details`;
}

export function shareThisPackLabel(kind?: string | null): string {
  return `Share ${thisPack(kind)}`;
}

export function bookmarkThisPackLabel(kind?: string | null): string {
  return `Bookmark ${thisPack(kind)}`;
}

export function replaceEntirePackLabel(kind?: string | null): string {
  return `Replace entire ${packNoun(kind)}`;
}

export function findInThisPack(kind?: string | null): string {
  return `Find in ${thisPack(kind)}`;
}

export function noDesignsInThisPack(kind?: string | null, liveOnly = false): string {
  return liveOnly
    ? `No live designs in ${thisPack(kind)}.`
    : `No designs in ${thisPack(kind)}.`;
}

export function pickWhoCanSeeThisPack(kind?: string | null, period = true): string {
  return `Pick who can see ${thisPack(kind)}${period ? '.' : ''}`;
}

export function chooseWhoCanSeeThisPack(kind?: string | null): string {
  return `Choose who can see ${thisPack(kind)}.`;
}

export function publishPackSheetTitle(kind?: string | null): string {
  return `Publish ${packNoun(kind)}`;
}

export function publishThisPackBeforeShare(kind?: string | null): string {
  return `Publish ${thisPack(kind)} before you share.`;
}

export function publishThisPackConsent(kind?: string | null, foreign = false): string {
  return foreign
    ? `You're sharing others' designs under their rules — publish ${thisPack(kind)}?`
    : `Start selling — publish ${thisPack(kind)}?`;
}

export function publishingThisPackExplore(kind?: string | null): string {
  const noun = packNoun(kind);
  return `Publishing ${thisPack(kind)} puts it on Explore — not each design separately. Buyers can still order or share designs from inside the ${noun}.`;
}

export function ratesOnRequestWhenForeign(kind?: string | null): string {
  return `Rates stay on request when ${thisPack(kind)} includes others’ designs.`;
}

export function packNameTakenTitle(kind?: string | null): string {
  return `This ${packNoun(kind)} already exists`;
}

export function packNameTakenBody(name: string, kind?: string | null): string {
  return `You already have “${name}”. Add these designs to that ${packNoun(kind)}, or type a new name.`;
}

export function askToSeeThisPack(kind?: string | null): string {
  return `Ask to see ${thisPack(kind)}`;
}

export function askToSeeThisPackBody(shop: string, kind?: string | null): string {
  return `Ask ${shop} to open ${thisPack(kind)} so you can look through it. Not connect, and not putting designs in your collection.`;
}

export function askedToOpenThisPack(shop: string, kind?: string | null): string {
  return `Asked ${shop} to open ${thisPack(kind)}. Designs unlock after they Allow in chat.`;
}

export function youCanViewThisPack(kind?: string | null): string {
  return `You can view ${thisPack(kind)}.`;
}

export function removedAccessToThisPack(kind?: string | null): string {
  return `Removed access to ${thisPack(kind)}.`;
}

export function allowedForThisPackOnly(kind?: string | null): string {
  return `Businesses you Allowed for ${thisPack(kind)} only — not Connections.`;
}

export function onlyThisPackLabel(kind?: string | null): string {
  return `Only ${thisPack(kind)}`;
}

export function deleteOnlyThisPackBody(kind?: string | null): string {
  return `Some of these designs are in other collections. Delete them everywhere, or only take them out of ${thisPack(kind)}?`;
}

export function libraryReplaceKeepsPack(kind?: string | null): string {
  return `Tap to pick the new set. Done with nothing selected keeps the ${packNoun(kind)} as it is.`;
}

export function untitledPackFallback(kind?: string | null): string {
  return packNounCap(kind);
}

export function createKindFromFlag(isCatalog: boolean): string {
  return isCatalog ? CollectionKind.Catalog : CollectionKind.Regular;
}
