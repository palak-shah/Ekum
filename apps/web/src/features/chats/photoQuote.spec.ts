import { describe, expect, it } from 'vitest';
import {
  quotedDesignFromAlbum,
  quotedPhotoUrl,
  replyPhotoIndexFromMetadata,
  replyProductIdFromMetadata,
  sendMessageSchema,
} from '@ekum/domain-types';
import { replyComposerLabel, quotedComposerThumbUrl } from './chatMessageActions';
import type { MessageView } from '@ekum/domain-types';

const album = {
  body: 'https://cdn.example/a.jpg',
  metadata: { urls: ['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg'] },
};

describe('quote one album photo', () => {
  it('reads the quoted index and URL', () => {
    expect(replyPhotoIndexFromMetadata({ replyToPhotoIndex: 1 })).toBe(1);
    expect(quotedPhotoUrl(album, 1)).toBe('https://cdn.example/b.jpg');
    expect(quotedPhotoUrl(album, 9)).toBe('https://cdn.example/a.jpg');
  });

  it('labels a quoted shot as Photo, not N photos', () => {
    const message = {
      type: 'photo',
      body: album.body,
      metadata: album.metadata,
      reference: null,
    } as MessageView;
    expect(replyComposerLabel(message)).toBe('2 photos');
    expect(replyComposerLabel(message, 1)).toBe('Photo');
  });
});

describe('quote one design in a set', () => {
  const album = {
    type: 'design_album',
    body: '3 designs',
    metadata: { productIds: ['p1', 'p2'] },
    reference: {
      kind: 'designs',
      id: 'm-set',
      name: '3 designs',
      image: null,
      available: true,
      productIds: ['p1', 'p2'],
      designItems: [
        { id: 'p1', name: 'Navy', image: 'https://cdn.example/navy.jpg' },
        { id: 'p2', name: 'Ivory', image: 'https://cdn.example/ivory.jpg' },
      ],
    },
  } as MessageView;

  it('reads the quoted product and thumb', () => {
    expect(replyProductIdFromMetadata({ replyToProductId: 'p2' })).toBe('p2');
    expect(quotedDesignFromAlbum(album.reference, 'p2')).toEqual({
      productId: 'p2',
      name: 'Ivory',
      image: 'https://cdn.example/ivory.jpg',
    });
    expect(quotedComposerThumbUrl(album, null, 'p2')).toBe('https://cdn.example/ivory.jpg');
  });

  it('labels a quoted design, not the whole set', () => {
    expect(replyComposerLabel(album)).toBe('3 designs');
    expect(replyComposerLabel(album, null, 'p2')).toBe('Design · Ivory');
  });

  it('requires a parent message and forbids mixing photo + design quotes', () => {
    expect(
      sendMessageSchema.safeParse({
        type: 'text',
        body: 'this one?',
        replyToProductId: 'p2',
      }).success,
    ).toBe(false);
    expect(
      sendMessageSchema.safeParse({
        type: 'text',
        body: 'this one?',
        replyToMessageId: 'm1',
        replyToPhotoIndex: 0,
        replyToProductId: 'p2',
      }).success,
    ).toBe(false);
    expect(
      sendMessageSchema.safeParse({
        type: 'text',
        body: 'this one?',
        replyToMessageId: 'm1',
        replyToProductId: 'p2',
      }).success,
    ).toBe(true);
  });
});
