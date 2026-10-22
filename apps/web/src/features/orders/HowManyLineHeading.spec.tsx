import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowManyLineHeading } from './HowManyLineHeading';

describe('HowManyLineHeading', () => {
  it('keeps the name clean and shows ₹/unit', () => {
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
    expect(screen.getByTestId('how-many-facts')).toHaveTextContent('₹1,200/pc');
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
    expect(screen.getByTestId('how-many-facts')).toHaveTextContent('₹100/pc · 1 set = 20 pcs');
  });

  it('native line is name + rate — no Piece or Metre', () => {
    render(<HowManyLineHeading name="Saree" unit="pc" rate={1000} />);
    expect(screen.queryByTestId('how-many-sold-as')).toBeNull();
    expect(screen.queryByText('Piece')).toBeNull();
    expect(screen.queryByText('Metre')).toBeNull();
    expect(screen.getByTestId('how-many-facts')).toHaveTextContent('₹1,000/pc');
  });

  it('hides price when there is no rate', () => {
    render(<HowManyLineHeading name="Saree" unit="mtr" />);
    expect(screen.queryByTestId('how-many-facts')).toBeNull();
    expect(screen.queryByText(/₹/)).toBeNull();
  });
});
