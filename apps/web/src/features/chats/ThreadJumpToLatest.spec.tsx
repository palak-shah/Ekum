import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThreadJumpToLatest } from './ThreadJumpToLatest';

describe('ThreadJumpToLatest', () => {
  it('hides when at the end', () => {
    render(<ThreadJumpToLatest visible={false} onJump={() => undefined} />);
    expect(screen.queryByTestId('thread-jump-latest')).toBeNull();
  });

  it('is a small down arrow that jumps to latest', async () => {
    const onJump = vi.fn();
    const user = userEvent.setup();
    render(<ThreadJumpToLatest visible onJump={onJump} />);
    const btn = screen.getByTestId('thread-jump-latest');
    expect(btn).toHaveAttribute('aria-label', 'Latest messages');
    expect(btn.className).toMatch(/h-10/);
    expect(btn.className).toMatch(/w-10/);
    await user.click(btn);
    expect(onJump).toHaveBeenCalledOnce();
  });
});
