import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExploreFeedFollowAction } from './ExploreFeedFollowAction';

describe('ExploreFeedFollowAction', () => {
  it('calls onFollow when tapped', async () => {
    const user = userEvent.setup();
    const onFollow = vi.fn();
    render(<ExploreFeedFollowAction onFollow={onFollow} />);

    await user.click(screen.getByTestId('explore-feed-follow'));
    expect(onFollow).toHaveBeenCalledOnce();
  });

  it('shows Following… when pending', () => {
    render(<ExploreFeedFollowAction onFollow={() => {}} pending />);
    expect(screen.getByTestId('explore-feed-follow')).toHaveTextContent('Following…');
  });
});
