import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '@/ui/kit';

describe('Avatar initials colours', () => {
  it('uses different fills for different names, not one teal', () => {
    render(
      <>
        <Avatar name="DAILY DOCUMENTS" />
        <Avatar name="EKUM" />
      </>,
    );
    const a = screen.getByText('DD');
    const b = screen.getByText('E');
    expect(a.style.backgroundColor).toBeTruthy();
    expect(a.style.backgroundColor).not.toBe(b.style.backgroundColor);
    expect(a.className).not.toMatch(/bg-accent/);
  });

  it('uses a people glyph for group fallback when there is no photo', () => {
    render(<Avatar name="Yash · Ethonique" fallback="group" />);
    expect(screen.getByTestId('avatar-group-fallback')).toBeInTheDocument();
    expect(screen.queryByText('YE')).toBeNull();
  });
});
