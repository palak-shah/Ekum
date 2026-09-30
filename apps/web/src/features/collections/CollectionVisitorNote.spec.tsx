import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CollectionVisitorNote } from './CollectionVisitorNote';

afterEach(() => cleanup());

describe('CollectionVisitorNote', () => {
  it('shows the pack note without View more when it fits', () => {
    render(<CollectionVisitorNote text="Festive sets this week." />);
    expect(screen.getByTestId('collection-visitor-note')).toHaveTextContent(
      'Festive sets this week.',
    );
    expect(screen.queryByRole('button', { name: 'View more' })).toBeNull();
  });
});
