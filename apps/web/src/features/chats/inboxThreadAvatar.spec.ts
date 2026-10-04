import { describe, expect, it } from 'vitest';
import { inboxThreadAvatarUrl } from './inboxThreadAvatar';

describe('inboxThreadAvatarUrl', () => {
  it('prefers group imageUrl over counterpart logo', () => {
    expect(
      inboxThreadAvatarUrl({
        type: 'group',
        imageUrl: 'https://cdn.example/g.jpg',
        counterpart: { id: 'c', name: 'X', logoUrl: 'https://cdn.example/shop.jpg' } as never,
      }),
    ).toBe('https://cdn.example/g.jpg');
  });

  it('uses counterpart logo on 1:1', () => {
    expect(
      inboxThreadAvatarUrl({
        type: 'direct',
        imageUrl: null,
        counterpart: { id: 'c', name: 'X', logoUrl: 'https://cdn.example/shop.jpg' } as never,
      }),
    ).toBe('https://cdn.example/shop.jpg');
  });
});
