import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateAlbumChangeStrip } from './CreateAlbumChangeStrip';

describe('CreateAlbumChangeStrip', () => {
  it('shows N designs · tap to change and toggles', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <CreateAlbumChangeStrip
        thumbs={[
          { key: 'a', src: 'https://example.test/a.jpg' },
          { key: 'b', src: 'https://example.test/b.jpg' },
        ]}
        count={12}
        expanded={false}
        onToggle={onToggle}
      />,
    );
    const strip = screen.getByTestId('collection-album-change');
    expect(strip).toHaveTextContent('12 designs · tap to change');
    expect(strip).toHaveAttribute('aria-expanded', 'false');
    await user.click(strip);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
