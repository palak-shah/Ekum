import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraftChip } from './DraftChip';

describe('DraftChip', () => {
  it('is a quiet Draft mark', () => {
    render(<DraftChip testId="collection-design-draft-chip" />);
    expect(screen.getByTestId('collection-design-draft-chip')).toHaveTextContent('Draft');
  });
});
