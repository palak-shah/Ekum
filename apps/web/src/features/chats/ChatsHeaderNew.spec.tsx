import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatsHeaderNew } from './ChatsHeaderNew';
import { requestChatsNewChat, subscribeChatsNewChat } from './chatsNewChat';
import { setChatsInboxSelecting } from './chatsInboxSelect';

vi.mock('@/lib/teamCaps', () => ({
  useTeamCaps: () => ({ can: () => true }),
}));

describe('ChatsHeaderNew', () => {
  it('requests New chat from the filled header control', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const stop = subscribeChatsNewChat(onOpen);
    setChatsInboxSelecting(false);
    render(<ChatsHeaderNew />);
    await user.click(screen.getByTestId('chats-new'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    stop();
  });
});

describe('requestChatsNewChat', () => {
  it('notifies subscribers', () => {
    const onOpen = vi.fn();
    const stop = subscribeChatsNewChat(onOpen);
    requestChatsNewChat();
    expect(onOpen).toHaveBeenCalledTimes(1);
    stop();
  });
});
