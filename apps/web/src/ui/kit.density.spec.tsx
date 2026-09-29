import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button, Chip, SearchInput, TextInput } from '@/ui/kit';
import { listSquareButtonClass } from '@/ui/ListSearchRow';
import { textInputChromeClass } from '@/ui/mobileOverflow';

describe('kit density (2026-09-26)', () => {
  it('uses 40px buttons and fields, 28px chips, 40×40 list squares', () => {
    render(
      <>
        <Button>Save</Button>
        <Chip onClick={() => undefined}>All</Chip>
        <TextInput aria-label="Name" />
        <SearchInput aria-label="Search" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Save' }).className).toMatch(/(?:^|\s)min-h-10(?:\s|$)/);
    expect(screen.getByRole('button', { name: 'All' }).className).toMatch(/(?:^|\s)h-7(?:\s|$)/);
    expect(screen.getByLabelText('Name').className).toMatch(/(?:^|\s)min-h-10(?:\s|$)/);
    expect(screen.getByLabelText('Search').className).toMatch(/(?:^|\s)min-h-10(?:\s|$)/);
    expect(screen.getByLabelText('Search').className).toMatch(/(?:^|\s)text-base(?:\s|$)/);
    expect(listSquareButtonClass).toMatch(/(?:^|\s)h-10(?:\s|$)/);
    expect(listSquareButtonClass).toMatch(/(?:^|\s)w-10(?:\s|$)/);
    expect(textInputChromeClass()).toContain('min-h-10');
  });
});
