/** Line note on the order face — loud enough traders cannot skim past it. */
export function OrderLineNoteCue({ note }: { note: string }) {
  const text = note.trim();
  if (!text) return null;
  return (
    <p
      className="mt-0.5 rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-emphasis leading-snug text-warning-ink"
      data-testid="order-line-note"
    >
      {text}
    </p>
  );
}
