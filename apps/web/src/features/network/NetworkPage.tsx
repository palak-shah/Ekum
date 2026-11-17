import { Link, useNavigate } from 'react-router-dom';
import { useTradePresence } from '@/lib/tradePresence';
import { PageHeader } from '@/ui/PageHeader';
import {
  NETWORK_CONNECTIONS,
  NETWORK_FOLLOWERS,
  NETWORK_FOLLOWING,
} from './networkSeeLabels';
import { ChevronRightIcon } from '@/ui/icons';

/** You → Network: following/followers first, then groups, then trade + invites. */
const SEE_LINKS = [
  {
    to: '/network/following',
    label: NETWORK_FOLLOWING.title,
    hint: NETWORK_FOLLOWING.subtitle,
  },
  {
    to: '/network/followers',
    label: NETWORK_FOLLOWERS.title,
    hint: NETWORK_FOLLOWERS.subtitle,
  },
] as const;

const TRADE_LINKS = [
  {
    to: '/network/connections',
    label: NETWORK_CONNECTIONS.title,
    hint: NETWORK_CONNECTIONS.subtitle,
  },
  { to: '/referrals', label: 'Invites', hint: 'Share connect-with-me links' },
] as const;

export function NetworkPage() {
  const navigate = useNavigate();
  const { selling, canPublish, trading } = useTradePresence();

  const links = [
    ...SEE_LINKS,
    ...(trading
      ? [
          {
            to: '/network/direct-links',
            label: 'Direct links',
            hint: 'Supplier and buyer who order together',
          },
        ]
      : []),
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
      <PageHeader title="Network" onBack={() => navigate('/more')} />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {links.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-foam"
          >
            <div className="min-w-0">
              <p className="text-sm font-emphasis text-ink">{item.label}</p>
              <p className="text-xs text-muted">{item.hint}</p>
            </div>
            <ChevronRightIcon className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
