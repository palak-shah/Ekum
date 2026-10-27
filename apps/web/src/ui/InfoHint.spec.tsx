import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Field, Sheet } from '@/ui/kit';
import { InfoHint } from '@/ui/InfoHint';

describe('InfoHint', () => {
  it('hides copy until tap; same control on a field and a sheet title', async () => {
    const user = userEvent.setup();
    render(
      <>
        <InfoHint label="About applying to all designs" testId="demo-info">
          Overwrites member rates. Tags add on.
        </InfoHint>
        <Field label="Category" info="Pick what you sell.">
          <input aria-label="Category" />
        </Field>
        <Sheet
          open
          title="Confirm / decline lines"
          titleInfo="Tick what you can supply."
          titleInfoTestId="order-lines-why"
          onClose={() => undefined}
        >
          <p>Body</p>
        </Sheet>
      </>,
    );

    expect(
      screen.queryByText(/Overwrites member rates/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Pick what you sell.')).not.toBeInTheDocument();
    expect(screen.queryByText('Tick what you can supply.')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('demo-info'));
    expect(screen.getByTestId('demo-info-body')).toHaveTextContent(
      'Overwrites member rates. Tags add on.',
    );

    await user.click(screen.getByRole('button', { name: 'About Category' }));
    expect(screen.getByText('Pick what you sell.')).toBeInTheDocument();

    await user.click(screen.getByTestId('order-lines-why'));
    expect(screen.getByTestId('order-lines-why-body')).toHaveTextContent(
      'Tick what you can supply.',
    );
  });
});
