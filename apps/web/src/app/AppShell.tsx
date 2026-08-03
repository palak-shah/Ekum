import { Suspense, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMyCompany, useUnreadCount } from '@/lib/queries';
import { BrandMark } from '@/ui/BrandMark';
import { Button, LoadingBlock, Sheet, cx } from '@/ui/kit';
import {
  BellIcon,
  ChatIcon,
  ExploreIcon,
  HomeIcon,
  OrdersIcon,
  PlusIcon,
} from '@/ui/icons';

/** WhatsApp-like order: Home · Chats · ＋ · Explore · Orders */
const NAV = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/chats', label: 'Chats', Icon: ChatIcon, end: false },
  { to: '/explore', label: 'Explore', Icon: ExploreIcon, end: false },
  { to: '/orders', label: 'Orders', Icon: OrdersIcon, end: false },
] as const;

/**
 * The authenticated, mobile-first shell: a slim top bar (brand + notifications),
 * bottom navigation, and a Create sheet whose verbs adapt to buyer vs seller.
 */
export function AppShell() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const company = useMyCompany();
  const unread = useUnreadCount();
  const capabilities = company.data?.capabilities;
  const canPublish = Boolean(capabilities?.publish);

  const go = (path: string) => {
    setSheetOpen(false);
    navigate(path);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-transparent">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur">
        <BrandMark size="header" />
        <div className="flex items-center gap-1">
          <button
            aria-label="Notifications"
            className="relative rounded-full p-2 text-ink hover:bg-foam"
            onClick={() => navigate('/notifications')}
          >
            <BellIcon />
            {unread.data && unread.data.count > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-tangerine px-1 text-[10px] font-bold text-ink">
                {unread.data.count > 9 ? '9+' : unread.data.count}
              </span>
            ) : null}
          </button>
          <button
            aria-label="Profile and settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
            onClick={() => navigate('/more')}
          >
            {(company.data?.name ?? 'E').charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <Suspense fallback={<LoadingBlock />}>
          <Outlet />
        </Suspense>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center justify-around border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur">
        {NAV.slice(0, 2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        <button
          aria-label="Create"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/25"
          onClick={() => setSheetOpen(true)}
        >
          <PlusIcon width={26} height={26} />
        </button>
        {NAV.slice(2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="New">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" fullWidth onClick={() => go('/orders/new')}>
            Photo order
          </Button>
          <Button variant="secondary" fullWidth onClick={() => go('/explore')}>
            Find a supplier
          </Button>
          {canPublish ? (
            <>
              <Button variant="secondary" fullWidth onClick={() => go('/catalog/products/new')}>
                Add designs
              </Button>
              <Button variant="secondary" fullWidth onClick={() => go('/catalog/collections/new')}>
                New collection
              </Button>
              <Button variant="secondary" fullWidth onClick={() => go('/broadcast/new')}>
                Broadcast to buyers
              </Button>
            </>
          ) : null}
          {capabilities?.refer ? (
            <Button variant="secondary" fullWidth onClick={() => go('/referrals/new')}>
              Refer a business
            </Button>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}

function NavItem({
  to,
  label,
  Icon,
  end,
}: {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  end: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium',
          isActive ? 'text-accent' : 'text-muted',
        )
      }
    >
      <Icon width={22} height={22} />
      {label}
    </NavLink>
  );
}
