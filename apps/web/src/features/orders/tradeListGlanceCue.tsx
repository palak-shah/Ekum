import { CheckIcon, ClockIcon, FwdIcon, TruckIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';
import {
  tradeListGlanceIcon,
  tradeListGlanceVerb,
  tradeListWaitingCue,
} from './tradeListGlance';
import type { TradeListItem } from './tradeList';

function GlanceIcon({ kind }: { kind: ReturnType<typeof tradeListGlanceIcon> }) {
  const props = { width: 14, height: 14, 'aria-hidden': true as const };
  if (kind === 'dispatch') return <TruckIcon {...props} />;
  if (kind === 'forward') return <FwdIcon {...props} />;
  return <CheckIcon {...props} />;
}

/** Right-of-facts cue — lime disc + verb, or muted clock waiting. Not a button. */
export function TradeListGlanceCue({ item }: { item: TradeListItem }) {
  const verb = tradeListGlanceVerb(item);
  if (verb) {
    const kind = tradeListGlanceIcon(verb);
    return (
      <span
        data-testid="orders-needs-you"
        data-glance-icon={kind}
        className="inline-flex shrink-0 items-center gap-[7px]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-badge text-badge-ink">
          <GlanceIcon kind={kind} />
        </span>
        <span className="whitespace-nowrap text-meta font-emphasis text-ink">{verb}</span>
      </span>
    );
  }
  const waiting = tradeListWaitingCue(item);
  if (!waiting) return null;
  return (
    <span
      data-testid="trade-list-waiting"
      className={cx(
        'inline-flex max-w-[48%] shrink-0 items-center gap-[5px] text-[12.5px] font-body text-muted',
      )}
    >
      <ClockIcon width={13} height={13} className="shrink-0" aria-hidden />
      <span className="truncate">{waiting}</span>
    </span>
  );
}
