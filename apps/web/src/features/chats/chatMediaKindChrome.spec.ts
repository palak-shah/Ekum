import { describe, expect, it } from 'vitest';
import { CollectionIcon, DocumentIcon, ImageIcon, ProductIcon } from '@/ui/icons';
import { chatMediaKindChrome } from './chatMediaKindChrome';

describe('chatMediaKindChrome', () => {
  it('uses kind icons instead of initials', () => {
    expect(chatMediaKindChrome('photos').Icon).toBe(ImageIcon);
    expect(chatMediaKindChrome('documents').Icon).toBe(DocumentIcon);
    expect(chatMediaKindChrome('designs').Icon).toBe(ProductIcon);
    expect(chatMediaKindChrome('collections').Icon).toBe(CollectionIcon);
  });

  it('tints design clay and collection steel', () => {
    expect(chatMediaKindChrome('designs').badge).toContain('kind-design');
    expect(chatMediaKindChrome('collections').badge).toContain('kind-collection');
    expect(chatMediaKindChrome('photos').badge).toContain('text-accent');
  });
});
