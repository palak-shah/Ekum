/** `tel:` href — keep leading + and digits only so spaces/dashes still dial. */
export function contactTelHref(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, '');
  const normalized = digits.startsWith('+')
    ? `+${digits.slice(1).replace(/\D/g, '')}`
    : digits.replace(/\D/g, '');
  if (!normalized || normalized === '+') return null;
  return `tel:${normalized}`;
}
