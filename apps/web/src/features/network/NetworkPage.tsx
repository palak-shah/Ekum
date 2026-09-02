import { Link } from 'react-router-dom';
import { useTradePresence } from '@/lib/tradePresence';
import { PageHeader } from '@/ui/PageHeader';
import { ChevronRightIcon } from '@/ui/icons';

const BASE_LINKS = [
  { to: '/network/connections', label: 'Connections', hint: 'Businesses you trade with' },
  { to: '/network/following', label: 'Following', hint: 'Businesses you follow' },
  { to: '/network/followers', label: 'Followers', hint: 'Businesses that follow you' },
  { to: '/network/requests', label: 'Requests', hint: 'Access requests to approve' },
  { to: '/referrals', label: 'Invites', hint: 'Share connect-with-me links' },
] as const;

/** You → Network: one entry to relationship lists (companies, not people). */
export function NetworkPage() {
  const { selling, canPublish } = useTradePresence();

  const links = [
    ...BASE_LINKS.slice(0, 1),
    ...(selling && canPublish
      ? [
          {
            to: '/broadcast',
            label: 'Buyer groups',
            hint: 'Saved buyer lists for publish and broadcast',
          },
        ]
      : []),
    ...BASE_LINKS.slice(1),
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Network" />
      <p className="text-sm text-muted">
        Manage connections, follows, and invites between businesses.
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
