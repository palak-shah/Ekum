import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ChatsHeaderNew } from './ChatsHeaderNew';
import { requestChatsNewChat, subscribeChatsNewChat } from './chatsNewChat';
import { setChatsInboxSelecting } from './chatsInboxSelect';

vi.mock('@/lib/teamCaps', () => ({
  useTeamCaps: () => ({ can: () => true }),
}));

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location-probe">{`${location.pathname}${location.search}`}</p>;
}

describe('ChatsHeaderNew', () => {
  it('opens New chat via /chats?new=1 (header and page may be separate chunks)', async () => {
    const user = userEvent.setup();
    setChatsInboxSelecting(false);
    render(
      <MemoryRouter initialEntries={['/chats']}>
        <Routes>
          <Route
            path="/chats"
            element={
              <>
                <ChatsHeaderNew />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('chats-new'));
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/chats?new=1');
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
