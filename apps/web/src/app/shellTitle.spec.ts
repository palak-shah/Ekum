import { describe, expect, it } from 'vitest';
import {
  isMainMenuPath,
  pageOwnsTopChrome,
  shellShowsHomeAccount,
  shellShowsHomeBack,
  shellTitle,
} from './shellTitle';

describe('shellTitle', () => {
  it('labels Home like the other tab roots', () => {
    expect(shellTitle('/')).toBe('Home');
    expect(shellTitle('/chats')).toBe('Chats');
    expect(shellTitle('/orders')).toBe('Orders');
    expect(shellTitle('/explore')).toBe('Explore');
    expect(shellTitle('/more')).toBe('My collections');
  });

  it('leaves thread and catalog chrome to PageHeader', () => {
    expect(shellTitle('/chats/abc')).toBeNull();
    expect(shellTitle('/catalog')).toBeNull();
  });

  it('puts Home Back on You, and Explore while Selecting', () => {
    expect(shellShowsHomeBack('/more')).toBe(true);
    expect(shellShowsHomeBack('/')).toBe(false);
    expect(shellShowsHomeBack('/chats')).toBe(false);
    expect(shellShowsHomeBack('/explore')).toBe(false);
    expect(shellShowsHomeBack('/explore', { exploreSelecting: true })).toBe(true);
  });

  it('shows account avatar on Home only — not My collections', () => {
    expect(shellShowsHomeAccount('/')).toBe(true);
    expect(shellShowsHomeAccount('/more')).toBe(false);
    expect(shellShowsHomeAccount('/explore')).toBe(false);
  });

  it('lets the shared design set own the top band (no empty shell line)', () => {
    expect(shellTitle('/designs/set')).toBeNull();
    expect(pageOwnsTopChrome('/designs/set')).toBe(true);
  });

  it('lets Network PageHeader own the top band (no second Network title)', () => {
    expect(shellTitle('/network')).toBeNull();
    expect(shellTitle('/network/following')).toBeNull();
    expect(pageOwnsTopChrome('/network')).toBe(true);
    expect(pageOwnsTopChrome('/network/connections')).toBe(true);
  });
});

describe('isMainMenuPath', () => {
  it('keeps the bar on the four tab roots', () => {
    expect(isMainMenuPath('/')).toBe(true);
    expect(isMainMenuPath('/chats')).toBe(true);
    expect(isMainMenuPath('/explore')).toBe(true);
    expect(isMainMenuPath('/orders')).toBe(true);
  });

  it('hides the bar on every other screen', () => {
    for (const path of [
      '/orders/new',
      '/orders/abc',
      '/o/token',
      '/chats/find',
      '/chats/archived',
      '/chats/starred',
      '/chats/t1',
      '/catalog/curate',
      '/catalog/products/new',
      '/catalog/products/d1',
      '/more',
      '/settings',
      '/settings/profile',
      '/settings/paths',
      '/settings/catalog-defaults',
      '/settings/units',
      '/team',
      '/notifications',
      '/grants',
      '/network',
      '/network/following',
      '/network/followers',
      '/network/connections',
      '/broadcast',
      '/broadcast/new',
      '/referrals',
      '/referrals/new',
      '/search',
      '/products/d1',
      '/company/meena',
      '/collections/pack-1',
      '/explore/products/d1',
      '/designs/set',
      '/selection',
      '/catalog/collections/new',
    ]) {
      expect(isMainMenuPath(path)).toBe(false);
    }
  });
});
