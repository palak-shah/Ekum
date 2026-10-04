import { describe, expect, it } from 'vitest';
import { isChatThreadPath } from './chatThreadPath';

describe('isChatThreadPath', () => {
  it('matches the open thread and group info', () => {
    expect(isChatThreadPath('/chats/t1')).toBe(true);
    expect(isChatThreadPath('/chats/t1/info')).toBe(true);
  });

  it('keeps bottom-nav list surfaces out', () => {
    expect(isChatThreadPath('/chats')).toBe(false);
    expect(isChatThreadPath('/chats/archived')).toBe(false);
    expect(isChatThreadPath('/chats/starred')).toBe(false);
    expect(isChatThreadPath('/chats/find')).toBe(false);
  });
});
