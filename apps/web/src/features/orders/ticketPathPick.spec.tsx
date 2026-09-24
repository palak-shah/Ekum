import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TicketPathPick } from './ticketPathPick';

describe('TicketPathPick', () => {
  it('shows only the selected path until opened', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(
      <TicketPathPick
        ticket="me"
        millLabel="These mills"
        millNames={['Surat Silk House', 'Ahmedabad Loom Co']}
        onPick={onPick}
        pickTestId="order-ticket-pick"
        meTestId="order-ticket-me"
        millTestId="order-ticket-mill"
      />,
    );

    expect(screen.getByText('Buyer talks to')).toBeInTheDocument();
    expect(screen.getByTestId('order-ticket-pick')).toHaveTextContent('You');
    expect(screen.queryByTestId('order-ticket-mill')).not.toBeVisible();

    await user.click(screen.getByTestId('order-ticket-pick'));
    expect(screen.getByTestId('order-ticket-mill')).toHaveTextContent('These mills');
    expect(screen.getByTestId('order-ticket-mill-names')).toHaveTextContent('Surat Silk House');

    await user.click(screen.getByTestId('order-ticket-mill'));
    expect(onPick).toHaveBeenCalledWith('mill');
  });
});
