import { describe, expect, it } from 'vitest';
import { catalogShareCopy, shareMessageText } from './shareInvite';

describe('shareMessageText', () => {
  it('puts the url on its own line so messengers make it tappable', () => {
    expect(shareMessageText('Wedding silks on Ekum — this collection', 'https://ekum.app/s/abc')).toBe(
      'Wedding silks on Ekum — this collection\nhttps://ekum.app/s/abc',
    );
  });

  it('does not duplicate an url already in the text', () => {
    const url = 'https://ekum.app/s/abc';
    expect(shareMessageText(`See it\n${url}`, url)).toBe(`See it\n${url}`);
  });
});

describe('catalogShareCopy', () => {
  it('names Ekum and the pack so the link is not a bare URL', () => {
    expect(catalogShareCopy({ name: 'Wedding silks', kind: 'collection' })).toEqual({
      title: 'Ekum · Wedding silks',
      text: 'Wedding silks on Ekum — this collection',
    });
  });

  it('calls a single design a design', () => {
    expect(catalogShareCopy({ name: 'Banarasi', kind: 'product' }).text).toContain('design');
  });
});
