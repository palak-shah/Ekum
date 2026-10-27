import { CollectionKind } from '@ekum/domain-types';
import { describe, expect, it } from 'vitest';
import {
  alsoDeleteDesignsDefault,
  packDeleteCopy,
  packDraftCopy,
  sharedDesignDraftCopy,
  youLibraryDeletedLabel,
} from './ownerPackLifecycle';

describe('owner pack lifecycle copy', () => {
  it('Delete copy — Archive is gone; catalog also-delete defaults on', () => {
    expect(packDeleteCopy(CollectionKind.Regular).title).toBe('Delete this collection?');
    expect(packDeleteCopy(CollectionKind.Regular).confirmLabel).toBe('Delete');
    expect(packDeleteCopy(CollectionKind.Regular).body).toMatch(/cannot be restored/);
    expect(alsoDeleteDesignsDefault(CollectionKind.Regular)).toBe(false);
    expect(alsoDeleteDesignsDefault(CollectionKind.Catalog)).toBe(true);
    expect(youLibraryDeletedLabel()).toBe('Deleted');
  });

  it('Draft pack and shared-design warnings use Draft, not Unpublish', () => {
    expect(packDraftCopy().title).toBe('Draft this collection?');
    expect(packDraftCopy().menuLabel).toBe('Draft this collection');
    expect(packDraftCopy().alsoDraftLabel).toBe('Also draft these designs');
    expect(packDraftCopy(CollectionKind.Catalog).title).toBe('Draft this catalog?');
    expect(packDraftCopy(CollectionKind.Catalog).menuLabel).toBe('Draft this catalog');
    expect(sharedDesignDraftCopy().body).toMatch(/every album you own/);
    expect(sharedDesignDraftCopy().confirmLabel).toBe('Draft');
  });
});
