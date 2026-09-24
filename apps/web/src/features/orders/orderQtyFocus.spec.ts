import { describe, expect, it } from 'vitest';
import { focusNextOrderQty, ORDER_QTY_ATTR, ORDER_QTY_SCOPE_ATTR } from './orderQtyFocus';

describe('focusNextOrderQty', () => {
  it('moves to the next enabled qty in the same sheet', () => {
    const root = document.createElement('div');
    root.setAttribute(ORDER_QTY_SCOPE_ATTR, '');
    const a = document.createElement('input');
    const b = document.createElement('input');
    const off = document.createElement('input');
    a.setAttribute(ORDER_QTY_ATTR, '');
    b.setAttribute(ORDER_QTY_ATTR, '');
    off.setAttribute(ORDER_QTY_ATTR, '');
    off.disabled = true;
    root.append(a, off, b);
    document.body.append(root);
    Object.defineProperty(a, 'offsetParent', { value: root });
    Object.defineProperty(b, 'offsetParent', { value: root });
    Object.defineProperty(off, 'offsetParent', { value: root });
    expect(focusNextOrderQty(a)).toBe(true);
    expect(document.activeElement).toBe(b);
    root.remove();
  });

  it('blurs when there is no next qty', () => {
    const root = document.createElement('div');
    root.setAttribute(ORDER_QTY_SCOPE_ATTR, '');
    const only = document.createElement('input');
    only.setAttribute(ORDER_QTY_ATTR, '');
    root.append(only);
    document.body.append(root);
    Object.defineProperty(only, 'offsetParent', { value: root });
    only.focus();
    expect(focusNextOrderQty(only)).toBe(false);
    expect(document.activeElement).not.toBe(only);
    root.remove();
  });
});
