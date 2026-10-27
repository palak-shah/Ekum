import { cx } from '@/lib/cx';

/** Quiet foam Draft mark on You / owner album tiles — not StatusPill. */
export const DRAFT_CHIP_CLASS =
  'shrink-0 rounded-full bg-foam px-1.5 py-0.5 text-[10px] font-emphasis tracking-tight text-ink';

export function DraftChip({ testId }: { testId: string }) {
  return (
    <span data-testid={testId} className={cx(DRAFT_CHIP_CLASS)}>
      Draft
    </span>
  );
}
