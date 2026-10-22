import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AddDesignsControl } from './AddDesignsControl';

describe('AddDesignsControl', () => {
  it('uses the same field fill on both add tiles', () => {
    render(
      <AddDesignsControl
        size="hero"
        onDesigns={() => undefined}
        onPhotos={() => undefined}
      />,
    );
    const designs = screen.getByTestId('collection-add-designs');
    const photos = screen.getByTestId('collection-add-photos');
    expect(designs.className).toContain('bg-input');
    expect(photos.className).toContain('bg-input');
    expect(designs.className).toContain('text-accent');
    expect(photos.className).toContain('text-accent');
    expect(designs.className).toBe(photos.className);
  });
});
