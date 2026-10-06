import { parseRateInput } from './rateInput';

export function parseRateParts(from: string, to: string): {
  rate: number | null;
  rateMax: number | null;
  invalid: boolean;
} {
  const low = parseRateInput(from).rate;
  const highRaw = to.trim();
  if (!highRaw) return { rate: low, rateMax: null, invalid: false };
  const high = parseRateInput(highRaw).rate;
  if (low == null || high == null || high < low) {
    return { rate: null, rateMax: null, invalid: Boolean(from.trim() || highRaw) };
  }
  if (high === low) return { rate: low, rateMax: null, invalid: false };
  return { rate: low, rateMax: high, invalid: false };
}

export function splitRateInput(raw: string): { from: string; to: string } {
  const parsed = parseRateInput(raw);
  if (parsed.rate == null) return { from: raw.trim() && !raw.includes('-') ? raw : '', to: '' };
  return {
    from: String(parsed.rate),
    to: parsed.rateMax != null ? String(parsed.rateMax) : '',
  };
}

export function rateRangeCaption(from: string, to: string): string {
  const { rate, rateMax, invalid } = parseRateParts(from, to);
  if (invalid) return 'High rate must be at least the low rate.';
  if (rate == null) return 'On request';
  const low = `₹${rate.toLocaleString('en-IN')}`;
  if (rateMax != null) return `${low}–₹${rateMax.toLocaleString('en-IN')}`;
  return low;
}

export function combineRateInput(from: string, to: string): string {
  const { rate, rateMax, invalid } = parseRateParts(from, to);
  if (invalid || rate == null) return from.trim();
  if (rateMax != null) return `${rate}-${rateMax}`;
  return String(rate);
}
