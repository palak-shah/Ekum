import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestChatsNewChat, subscribeChatsNewChat } from './chatsNewChat';

describe('chatsNewChat', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('notifies subscribers through a window event (cross-chunk safe)', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeChatsNewChat(listener);
    requestChatsNewChat();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    requestChatsNewChat();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
