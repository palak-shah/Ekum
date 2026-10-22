import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LibraryPickTile } from './LibraryPickTile';

describe('LibraryPickTile', () => {
  it('uses the app-wide 18px accent check and shrink — not a green badge or teal frame', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { container, rerender } = render(
      <LibraryPickTile
        name="Banarasi Silk Saree"
        imageUrl="/banarasi.jpg"
        selected={false}
        onClick={onClick}
      />,
    );
    expect(screen.getByTestId('selectable-media')).toBeTruthy();
    expect(container.querySelector('.bg-badge')).toBeNull();
    expect(container.querySelector('.border-accent')).toBeNull();
    expect(screen.getByRole('button', { name: 'Banarasi Silk Saree' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    rerender(
      <LibraryPickTile
        name="Banarasi Silk Saree"
        imageUrl="/banarasi.jpg"
        selected
        onClick={onClick}
      />,
    );
    const frame = screen.getByTestId('selectable-media-selected');
    expect(frame.className).not.toContain('bg-accent');
    const check = container.querySelector('[data-testid="selectable-media-selected"] > span');
    expect(check?.className).toContain('bg-accent');
    expect(check?.className).toContain('h-[18px]');
    expect(check?.className).toContain('w-[18px]');
    expect(check?.className).toContain('right-2');
    expect(check?.className).toContain('top-2');
    expect(check?.className).not.toContain('h-6');
    expect(check?.textContent).not.toContain('✓');
    const media = container.querySelector('[data-testid="selectable-media-selected"] > div');
    expect(media?.className ?? '').toContain('scale-[0.92]');

    await user.click(screen.getByRole('button', { name: 'Banarasi Silk Saree' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
