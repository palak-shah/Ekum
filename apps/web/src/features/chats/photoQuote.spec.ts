import { describe, expect, it } from 'vitest';
import { quotedPhotoUrl, replyPhotoIndexFromMetadata } from '@ekum/domain-types';
import { replyComposerLabel } from './chatMessageActions';
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
