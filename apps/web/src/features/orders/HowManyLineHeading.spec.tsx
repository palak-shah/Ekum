import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowManyLineHeading } from './HowManyLineHeading';

describe('HowManyLineHeading', () => {
  it('shows Set beside the name when order unit is set — not Piece', () => {
    render(
      <HowManyLineHeading
        name="EK-0C7946D0"
        unit="set"
        dispatchUnit="pc"
        piecesPerPack={4}
        rate={1200}
      />,
    );
    expect(screen.getByTestId('how-many-sold-as')).toHaveTextContent('Set');
    expect(screen.getByTestId('how-many-sold-as')).not.toHaveTextContent('Piece');
    expect(screen.getByTestId('how-many-facts')).toHaveTextContent('4 pcs');
    expect(screen.getByTestId('how-many-facts')).toHaveTextContent('₹1,200/pc');
  });

  it('shows Piece only when order unit is pc', () => {
    render(<HowManyLineHeading name="Saree" unit="pc" rate={1000} />);
    expect(screen.getByTestId('how-many-sold-as')).toHaveTextContent('Piece');
  });
});
