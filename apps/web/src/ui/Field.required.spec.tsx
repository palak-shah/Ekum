import { render, screen } from '@testing-library/react';
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
});
