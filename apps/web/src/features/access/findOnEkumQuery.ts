/** Query looks like a mobile (or GST-ish digit run) — invite CTA only on empty phone-like search. */
export function isPhoneLikeQuery(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 7;
}
