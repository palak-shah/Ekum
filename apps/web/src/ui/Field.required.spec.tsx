import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Field } from './kit';

describe('Field required', () => {
  it('marks a required label with *', () => {
    render(
      <Field label="Business name" required>
        <input aria-label="Business name" />
      </Field>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Business name').textContent).toMatch(/\*/);
  });

  it('does not star an optional label', () => {
    render(
      <Field label="About">
        <input aria-label="About" />
      </Field>,
    );
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('puts instructional copy on the shared i, not under the field', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Tags" info="Buyers find this collection by these tags.">
        <input aria-label="Tags" />
      </Field>,
    );
    expect(screen.queryByText('Buyers find this collection by these tags.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'About Tags' }));
    expect(screen.getByText('Buyers find this collection by these tags.')).toBeInTheDocument();
  });
});
