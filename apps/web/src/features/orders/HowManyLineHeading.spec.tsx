import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowManyLineHeading } from './HowManyLineHeading';

describe('HowManyLineHeading', () => {
  it('keeps the name clean and shows price per set — no Set or /pc', () => {
    render(
      <HowManyLineHeading
        name="Linen Summer"
        unit="set"
        dispatchUnit="pc"
        piecesPerPack={4}
        rate={1200}
      />,
    );
    expect(screen.queryByTestId('how-many-sold-as')).toBeNull();
    expect(screen.getByText('Linen Summer')).toBeTruthy();
    expect(screen.getByTestId('how-many-facts')).toHaveTextContent('₹4,800');
    expect(screen.getByTestId('how-many-facts').textContent).not.toMatch(/pc|Set/i);
  });

  it('shows pcs in the set when sizes on the sheet differ', () => {
    render(
      <HowManyLineHeading
        name="Linen Summer"
        unit="set"
        dispatchUnit="pc"
        piecesPerPack={20}
        rate={100}
        showPackSize
      />,
    );
    expect(screen.getByTestId('how-many-facts')).toHaveTextContent('₹2,000 · 1 set = 20 pcs');
  });

  it('shows Piece only when order unit is pc', () => {
    render(<HowManyLineHeading name="Saree" unit="pc" rate={1000} />);
    expect(screen.getByTestId('how-many-sold-as')).toHaveTextContent('Piece');
  });
});
