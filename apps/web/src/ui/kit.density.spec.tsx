import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button, Chip, EmptyState, SearchInput, TextArea, TextInput, listRowClass } from '@/ui/kit';
import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';
import { listSquareButtonClass } from '@/ui/ListSearchRow';
import { textInputChromeClass } from '@/ui/mobileOverflow';

describe('kit density (2026-10-29 Ink & Lime)', () => {
  it('uses 48px buttons and fields, 32px chips, 48×48 list squares', () => {
    render(
      <>
        <Button>Save</Button>
        <Chip onClick={() => undefined}>All</Chip>
        <TextInput aria-label="Name" />
        <TextArea aria-label="Notes" />
        <SearchInput aria-label="Search" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Save' }).className).toMatch(/(?:^|\s)min-h-12(?:\s|$)/);
    expect(screen.getByRole('button', { name: 'All' }).className).toMatch(/(?:^|\s)h-8(?:\s|$)/);
    expect(screen.getByLabelText('Name').className).toMatch(/(?:^|\s)min-h-12(?:\s|$)/);
    expect(screen.getByLabelText('Search').className).toMatch(/(?:^|\s)min-h-12(?:\s|$)/);
    expect(screen.getByLabelText('Search').className).toMatch(/(?:^|\s)text-base(?:\s|$)/);
    expect(screen.getByLabelText('Name').className).toContain('placeholder:text-sm');
    expect(screen.getByLabelText('Name').className).toContain('placeholder:not-italic');
    expect(listSquareButtonClass).toMatch(/(?:^|\s)h-12(?:\s|$)/);
    expect(listSquareButtonClass).toMatch(/(?:^|\s)w-12(?:\s|$)/);
    expect(textInputChromeClass()).toContain('min-h-12');
    expect(screen.getByLabelText('Name').className).toContain(FIELD_IDLE_FILL_CLASS);
    expect(screen.getByLabelText('Notes').className).toContain(FIELD_IDLE_FILL_CLASS);
    expect(screen.getByRole('button', { name: 'Save' }).className).toContain('text-on-accent');
    const chip = screen.getByRole('button', { name: 'All' });
    expect(chip.className).toContain('bg-foam');
    expect(chip.className).not.toContain('bg-chip-on');
    expect(chip.className).not.toMatch(/(?:^|\s)border(?:\s|$)/);
    expect(chip.className).not.toContain('border-accent');
    const search = screen.getByLabelText('Search');
    expect(search.className).toMatch(/(?:^|\s)border(?:\s|$)/);
    expect(search.className).toContain(FIELD_IDLE_FILL_CLASS);
    expect(listRowClass).toMatch(/border-b/);
    expect(listRowClass).toContain('hover:bg-foam');
  });

  it('paints the selected Chip with chip-on tint', () => {
    render(
      <Chip active onClick={() => undefined}>
        All
      </Chip>,
    );
    const chip = screen.getByRole('button', { name: 'All' });
    expect(chip.className).toContain('bg-chip-on');
    expect(chip.className).toContain('text-chip-on-ink');
    expect(chip.className).toContain('font-title');
    expect(chip.className).not.toContain('bg-foam');
  });

  it('uses 15px title type on EmptyState', () => {
    render(<EmptyState title="No requests" message="First messages land here." />);
    const title = screen.getByText('No requests');
    expect(title.className).toContain('text-[15px]');
    expect(title.className).toContain('font-title');
  });

  it('hides the placeholder while a kit field is focused', async () => {
    const user = userEvent.setup();
    render(<TextInput aria-label="Rate" placeholder="Rate" />);
    const field = screen.getByLabelText('Rate');
    expect(field).toHaveAttribute('placeholder', 'Rate');
    await user.click(field);
    expect(field).not.toHaveAttribute('placeholder');
  });

  it('locks a loading Button with the shared Spinner', () => {
    const onClick = () => undefined;
    render(
      <Button loading onClick={onClick}>
        Update collection
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Update collection' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.animate-spin')).toBeTruthy();
  });
});
