import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sheet } from './kit';

describe('Sheet viewport height', () => {
  it('hugs content up to 100dvh (not a short 40rem / 92dvh ceiling)', () => {
    render(
      <Sheet open title="Share" onClose={() => undefined}>
        <p>Body</p>
      </Sheet>,
    );
    const panel = screen.getByRole('dialog').querySelector('.ekum-sheet');
    expect(panel).toBeTruthy();
    expect(panel!.className).toMatch(/max-h-\[100dvh\]/);
    expect(panel!.className).not.toMatch(/(?:^|\s)h-\[100dvh\]/);
    expect(panel!.className).not.toMatch(/40rem|92dvh/);
  });

  it('pins Close to the top-right corner on default sheets', () => {
    render(
      <Sheet open title="Share" onClose={() => undefined}>
        <p>Body</p>
      </Sheet>,
    );
    const close = screen.getByTestId('sheet-close');
    expect(close.className).toMatch(/absolute/);
    expect(close.className).toMatch(/right-2/);
    expect(close.className).toMatch(/top-2/);
  });

  it('keeps instructional copy on the title i until tap', () => {
    render(
      <Sheet
        open
        title="Confirm / decline lines"
        titleInfo="Tick what you can supply."
        titleInfoTestId="order-lines-why"
        onClose={() => undefined}
      >
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByTestId('order-lines-why')).toHaveAttribute(
      'aria-label',
      'About Confirm / decline lines',
    );
    expect(screen.queryByTestId('order-lines-why-body')).not.toBeInTheDocument();
  });
});
