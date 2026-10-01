import { describe, expect, it } from 'vitest';
import { pageOwnsTopChrome, shellShowsHomeBack, shellTitle } from './shellTitle';

describe('shellTitle', () => {
  it('labels Home like the other tab roots', () => {
    expect(shellTitle('/')).toBe('Home');
    expect(shellTitle('/chats')).toBe('Chats');
    expect(shellTitle('/orders')).toBe('Orders');
    expect(shellTitle('/explore')).toBe('Explore');
  });

  it('leaves thread and catalog chrome to PageHeader', () => {
    expect(shellTitle('/chats/abc')).toBeNull();
    expect(shellTitle('/catalog')).toBeNull();
  });

  it('puts Home Back on You only', () => {
    expect(shellShowsHomeBack('/more')).toBe(true);
    expect(shellShowsHomeBack('/')).toBe(false);
    expect(shellShowsHomeBack('/chats')).toBe(false);
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
