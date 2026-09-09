import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Button, Card, Tag } from '@/ui/kit';
import { ChevronRightIcon } from '@/ui/icons';

export function MorePage() {
  const navigate = useNavigate();
  const { logout, session } = useAuth();
  const company = useMyCompany();
  const { buying, selling, canPublish, trading } = useTradePresence();

  const menu = [
    ...(selling
      ? [
          {
            to: '/catalog',
            label: 'My designs & collections',
            hint: 'Drafts, packs, publish',
          },
        ]
      : []),
    { to: '/saved', label: 'Saved' },
    { to: '/starred', label: 'Starred' },
    { to: '/network', label: 'Network' },
    { to: '/team', label: 'Team' },
    ...(trading
      ? [
          {
            to: '/settings/paths',
            label: 'Your paths',
            hint: 'Who orders are with · see each other',
          },
        ]
      : []),
    { to: '/settings', label: 'Settings' },
    { to: '/settings/profile', label: 'Business profile' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="You" />

      <Card className="flex items-center gap-3">
        <Avatar
          name={company.data?.name ?? 'E'}
          imageUrl={company.data?.logoUrl}
          size={52}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink">
            {company.data?.name ?? 'Your business'}
          </p>
          <p className="truncate text-xs text-muted">
            {[
              company.data?.contactPerson?.trim() || session?.user.name?.trim(),
              company.data?.city,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {company.data?.verification === 'gst_verified' ? <Tag tone="success">Verified</Tag> : null}
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {buying ? <Tag tone="info">Buying</Tag> : null}
        {selling ? <Tag tone="info">Selling</Tag> : null}
        {canPublish ? <Tag tone="info">Can publish</Tag> : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {menu.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-foam"
          >
            <span className="min-w-0">
              <span className="block text-sm text-ink">{item.label}</span>
              {'hint' in item && item.hint ? (
                <span className="mt-0.5 block text-xs text-muted">{item.hint}</span>
              ) : null}
            </span>
            <ChevronRightIcon className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          void logout().then(() => navigate('/login', { replace: true }));
        }}
      >
        Log out
      </Button>
    </div>
  );
}
