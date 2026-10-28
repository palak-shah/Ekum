import type { ReactNode } from 'react';

/**
 * Create/edit Product details: Category, then Rate, then tags.
 * Rate per options follow the selected category, so Rate sits immediately after it.
 */
export function ProductDetailsSlots({
  category,
  rate,
  tags,
}: {
  category: ReactNode;
  rate: ReactNode;
  tags: ReactNode;
}) {
  return (
    <>
      {category}
      {rate}
      {tags}
    </>
  );
}
