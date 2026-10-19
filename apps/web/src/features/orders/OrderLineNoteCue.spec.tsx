import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderLineNoteCue } from './OrderLineNoteCue';

describe('OrderLineNoteCue', () => {
  it('renders empty as null', () => {
    const { container } = render(<OrderLineNoteCue note="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('uses warning highlight so line notes are hard to skim past (BM-11)', () => {
    render(<OrderLineNoteCue note="iska Chota than" />);
    const el = screen.getByTestId('order-line-note');
    expect(el).toHaveTextContent('iska Chota than');
    expect(el.className).toContain('bg-warning-soft');
    expect(el.className).toContain('text-warning-ink');
    expect(el.className).toContain('font-emphasis');
  });
});
