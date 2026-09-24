import type { KeyboardEvent } from 'react';

export const ORDER_QTY_ATTR = 'data-order-qty';
export const ORDER_QTY_SCOPE_ATTR = 'data-order-qty-scope';

export function focusNextOrderQty(from: HTMLInputElement): boolean {
  const root =
    from.closest(`[${ORDER_QTY_SCOPE_ATTR}]`) ??
    from.closest('[role="dialog"]') ??
    document.body;
  const fields = [...root.querySelectorAll<HTMLInputElement>(`input[${ORDER_QTY_ATTR}]`)].filter(
    (el) => !el.disabled && el.offsetParent !== null,
  );
  const index = fields.indexOf(from);
  const next = index >= 0 ? fields[index + 1] : undefined;
  if (!next) {
    from.blur();
    return false;
  }
  next.focus();
  next.select();
  return true;
}

export function onOrderQtyEnterKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  focusNextOrderQty(event.currentTarget);
}

export function orderQtyInputProps(isLast: boolean) {
  return {
    [ORDER_QTY_ATTR]: '',
    enterKeyHint: (isLast ? 'done' : 'next') as 'done' | 'next',
    onKeyDown: onOrderQtyEnterKeyDown,
  };
}
