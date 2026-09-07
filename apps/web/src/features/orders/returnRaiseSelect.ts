/** Pure helpers for Raise a return Select all / Clear. */

export type ReturnRaiseLine = {
  id: string;
  quantity: number;
};

export function selectAllReturnLines(items: ReturnRaiseLine[]): {
  selected: Record<string, boolean>;
  qty: Record<string, string>;
} {
  const selected: Record<string, boolean> = {};
  const qty: Record<string, string> = {};
  for (const item of items) {
    selected[item.id] = true;
    qty[item.id] = String(item.quantity);
  }
  return { selected, qty };
}

/** All lines off — caller keeps existing qty map. */
export function clearReturnSelection(items: ReturnRaiseLine[]): Record<string, boolean> {
  const selected: Record<string, boolean> = {};
  for (const item of items) {
    selected[item.id] = false;
  }
  return selected;
}

export function allReturnLinesSelected(
  items: ReturnRaiseLine[],
  selected: Record<string, boolean>,
): boolean {
  if (items.length === 0) return false;
  return items.every((item) => selected[item.id] === true);
}
