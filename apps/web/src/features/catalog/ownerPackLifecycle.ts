import { CollectionKind } from '@ekum/domain-types';

export function alsoDeleteDesignsDefault(kind?: string | null): boolean {
  return kind === CollectionKind.Catalog;
}

export function packDeleteCopy(kind?: string | null): {
  title: string;
  body: string;
  alsoDeleteLabel: string;
  alsoDeleteDefault: boolean;
  confirmLabel: string;
} {
  const catalog = kind === CollectionKind.Catalog;
  return {
    title: catalog ? 'Delete this catalog?' : 'Delete this collection?',
    body: catalog
      ? 'Deleted catalogs stay in Deleted. They cannot be restored.'
      : 'Deleted collections stay in Deleted. They cannot be restored.',
    alsoDeleteLabel: 'Also delete designs',
    alsoDeleteDefault: alsoDeleteDesignsDefault(kind),
    confirmLabel: 'Delete',
  };
}

export function packDraftCopy(kind?: string | null): {
  title: string;
  body: string;
  alsoDraftLabel: string;
  confirmLabel: string;
  menuLabel: string;
} {
  const catalog = kind === CollectionKind.Catalog;
  return {
    title: catalog ? 'Draft this catalog?' : 'Draft this collection?',
    body: 'Draft hides it from Explore. Designs stay as they are unless you also draft them.',
    alsoDraftLabel: 'Also draft these designs',
    confirmLabel: 'Draft',
    menuLabel: catalog ? 'Draft this catalog' : 'Draft this collection',
  };
}

export function sharedDesignDraftCopy(): { title: string; body: string; confirmLabel: string } {
  return {
    title: 'Draft this design?',
    body: 'This design is in more than one collection. Drafting it shows as Draft on every album you own. Buyers won’t see it.',
    confirmLabel: 'Draft',
  };
}

export function youLibraryDeletedLabel(): string {
  return 'Deleted';
}
