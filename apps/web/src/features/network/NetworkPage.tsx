import { Link } from 'react-router-dom';
import { useTradePresence } from '@/lib/tradePresence';
import { PageHeader } from '@/ui/PageHeader';
import { I_SEE_THEIRS, THEY_SEE_MINE } from './networkSeeLabels';
import { ChevronRightIcon } from '@/ui/icons';

/** You → Network: see-packs first, then groups, then trade + invites. */
const SEE_LINKS = [
  { to: '/network/following', label: I_SEE_THEIRS.title, hint: I_SEE_THEIRS.hint },
  { to: '/network/followers', label: THEY_SEE_MINE.title, hint: THEY_SEE_MINE.hint },
] as const;

const TRADE_LINKS = [
  { to: '/network/connections', label: 'Connections', hint: 'Businesses you trade with' },
  { to: '/referrals', label: 'Invites', hint: 'Share connect-with-me links' },
] as const;

export function NetworkPage() {
  const { selling, canPublish } = useTradePresence();

  const links = [
    ...SEE_LINKS,
    ...(selling && canPublish
      ? [
          {
            to: '/broadcast',
            label: 'Buyer groups',
            hint: 'Saved buyer lists for publish and broadcast',
          },
        ]
      : []),
    ...TRADE_LINKS,
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Network" />
      <p className="text-sm text-muted">
        Who you trade with, who sees collections, and invites between businesses.
      </p>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {links.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-foam"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{item.label}</p>
              <p className="text-xs text-muted">{item.hint}</p>
            </div>
            <ChevronRightIcon className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
