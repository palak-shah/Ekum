export function orderSheetTitle(count: number): string {
  return count === 1 ? '1 design' : `${count} designs`;
}

export type QtyMode = 'same' | 'perDesign';
