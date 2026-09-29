import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FollowAskDecideRow } from './FollowAskDecideRow';

describe('FollowAskDecideRow', () => {
  it('defaults see-collections on and Allows look', async () => {
    const user = userEvent.setup();
    const onAllow = vi.fn();
    render(<FollowAskDecideRow onAllow={onAllow} onDecline={() => undefined} />);
    expect(screen.getByRole('checkbox', { name: 'They can see my collections' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('checkbox', { name: 'They can share my collections' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Allow' }));
    expect(onAllow).toHaveBeenCalledWith('look');
  });

  it('Allows pack when they can share is checked', async () => {
    const user = userEvent.setup();
    const onAllow = vi.fn();
    render(<FollowAskDecideRow onAllow={onAllow} onDecline={() => undefined} />);
    await user.click(screen.getByRole('checkbox', { name: 'They can share my collections' }));
    await user.click(screen.getByRole('button', { name: 'Allow' }));
    expect(onAllow).toHaveBeenCalledWith('pack');
  });

  it('turns Allow off when the grant is unchecked', async () => {
    const user = userEvent.setup();
    render(<FollowAskDecideRow onAllow={() => undefined} onDecline={() => undefined} />);
    await user.click(screen.getByRole('checkbox', { name: 'They can see my collections' }));
    expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled();
  });

  it('Declines', async () => {
    const user = userEvent.setup();
    const onDecline = vi.fn();
    render(<FollowAskDecideRow onAllow={() => undefined} onDecline={onDecline} />);
    await user.click(screen.getByRole('button', { name: 'Decline' }));
    expect(onDecline).toHaveBeenCalled();
  });
});
