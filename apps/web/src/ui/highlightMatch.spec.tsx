import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { highlightSearchText } from './highlightMatch';

describe('highlightSearchText', () => {
  it('marks the matching letters and leaves the rest plain', () => {
    render(<p>{highlightSearchText('Order #ECNL', 'ecnl')}</p>);
    const mark = screen.getByText('ECNL');
    expect(mark.tagName).toBe('MARK');
    expect(screen.getByText(/Order #/)).toBeInTheDocument();
  });

  it('returns the string when nothing matches', () => {
    expect(highlightSearchText('Silk', 'cotton')).toBe('Silk');
    expect(highlightSearchText('Silk', '   ')).toBe('Silk');
  });
});
