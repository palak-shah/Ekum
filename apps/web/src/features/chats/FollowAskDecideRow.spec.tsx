import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FollowAskDecideRow } from './FollowAskDecideRow';

describe('FollowAskDecideRow', () => {
  it('Accepts look with Allow Repost off by default', async () => {
    const user = userEvent.setup();
    const onAllow = vi.fn();
    render(<FollowAskDecideRow onAllow={onAllow} onDecline={() => undefined} />);
    expect(screen.queryByRole('checkbox', { name: 'They can see my collections' })).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Allow Repost' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onAllow).toHaveBeenCalledWith('look');
  });

  it('Accepts pack when Allow Repost is checked', async () => {
    const user = userEvent.setup();
    const onAllow = vi.fn();
    render(<FollowAskDecideRow onAllow={onAllow} onDecline={() => undefined} />);
    await user.click(screen.getByRole('checkbox', { name: 'Allow Repost' }));
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onAllow).toHaveBeenCalledWith('pack');
  });

  it('keeps Accept enabled without a See checkbox', () => {
    render(<FollowAskDecideRow onAllow={() => undefined} onDecline={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Accept' })).not.toBeDisabled();
  });

  it('defaults Allow Repost on for a Direct Link Repost ask', async () => {
    const user = userEvent.setup();
    const onAllow = vi.fn();
    render(
      <FollowAskDecideRow kind="share" onAllow={onAllow} onDecline={() => undefined} />,
    );
    expect(screen.getByRole('checkbox', { name: 'Allow Repost' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onAllow).toHaveBeenCalledWith('pack');
  });

  it('Rejects', async () => {
    const user = userEvent.setup();
    const onDecline = vi.fn();
    render(<FollowAskDecideRow onAllow={() => undefined} onDecline={onDecline} />);
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(onDecline).toHaveBeenCalled();
  });
});
