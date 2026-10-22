import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TransporterField } from './TransporterField';

describe('TransporterField', () => {
  it('names itself when empty, compact or not', () => {
    const { rerender } = render(
      <TransporterField value="" onChange={() => undefined} />,
    );
    expect(screen.getByTestId('transporter-field')).toHaveAttribute(
      'placeholder',
      'Transporter · optional',
    );
    rerender(<TransporterField value="" onChange={() => undefined} compact />);
    expect(screen.getByTestId('transporter-field')).toHaveAttribute(
      'placeholder',
      'Transporter · optional',
    );
  });
});
