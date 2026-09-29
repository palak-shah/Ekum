import { CheckIcon } from './icons';

/** Quiet GST mark beside a shop name — not a “GST verified” chip. */
export function GstTick({ className }: { className?: string }) {
  return (
    <CheckIcon
      width={14}
      height={14}
      className={className ?? 'shrink-0 text-accent'}
      aria-label="GST verified"
      data-testid="gst-tick"
    />
  );
}

export function isGstVerified(verification: string | null | undefined): boolean {
  return verification === 'gst_verified';
}
