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
});
