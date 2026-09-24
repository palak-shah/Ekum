import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchInput } from '@/ui/kit';

describe('SearchInput', () => {
  it('puts the search icon before the typed text', () => {
    const { container } = render(<SearchInput aria-label="Search chats" placeholder="Search chats" />);
    const field = screen.getByLabelText('Search chats');
    const icon = container.querySelector('svg');
    expect(icon).toBeTruthy();
    expect(icon!.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('asks the mobile keyboard for a Search key', () => {
    render(<SearchInput aria-label="Search chats" />);
    const field = screen.getByLabelText('Search chats');
    expect(field).toHaveAttribute('type', 'search');
    expect(field).toHaveAttribute('enterkeyhint', 'search');
    expect(field).toHaveAttribute('inputmode', 'search');
  });

  it('keeps placeholder text tight to the leading icon', () => {
    const { container } = render(<SearchInput aria-label="Find" placeholder="Find" />);
    const icon = container.querySelector('svg');
    const field = screen.getByLabelText('Find');
    expect(icon?.getAttribute('class') ?? '').toMatch(/left-3(?:\s|$)/);
    expect(field.className).toMatch(/(?:^|\s)pl-9(?:\s|$)/);
  });
});
