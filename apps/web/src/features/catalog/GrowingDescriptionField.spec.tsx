import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GrowingDescriptionField } from './GrowingDescriptionField';

describe('GrowingDescriptionField', () => {
  it('starts as one kit row', () => {
    render(<GrowingDescriptionField value="" onChange={() => undefined} />);
    const field = screen.getByTestId('collection-description');
    expect(field.tagName).toBe('TEXTAREA');
    expect(field.className).toContain('min-h-10');
    expect(field.className).toContain('resize-none');
  });
});
