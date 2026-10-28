import { render, screen } from '@testing-library/react';
import { ProductDetailsSlots } from './ProductDetailsSlots';

describe('ProductDetailsSlots', () => {
  it('puts Rate immediately after Category, then tags', () => {
    render(
      <ProductDetailsSlots
        category={<div data-testid="slot-category">Category</div>}
        rate={<div data-testid="slot-rate">Rate</div>}
        tags={<div data-testid="slot-tags">Tags</div>}
      />,
    );
    const category = screen.getByTestId('slot-category');
    const rate = screen.getByTestId('slot-rate');
    const tags = screen.getByTestId('slot-tags');
    expect(category.compareDocumentPosition(rate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rate.compareDocumentPosition(tags) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
