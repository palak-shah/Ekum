import { Suspense, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useChatUnreadCount, useMyCompany, useUnreadCount } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { Avatar, Button, LoadingBlock, Sheet, cx } from '@/ui/kit';
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

function shellTitle(pathname: string): string | null {
  if (pathname === '/') return null;
  if (pathname.startsWith('/chats')) return pathname === '/chats' ? 'Chats' : null;
  if (pathname.startsWith('/orders')) return pathname === '/orders' ? 'Orders' : null;
  if (pathname.startsWith('/explore') || pathname.startsWith('/search')) return 'Explore';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/more') || pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
    return 'More';
  }
  if (pathname.startsWith('/buyers') || pathname.startsWith('/network')) return 'Network';
  if (pathname.startsWith('/following') || pathname.startsWith('/followers')) return 'Network';
  if (pathname.startsWith('/catalog')) return 'My designs';
  if (pathname.startsWith('/company')) return 'Business';
  if (pathname.startsWith('/collections')) return 'Collection';
  if (pathname.startsWith('/products')) return 'Design';
  if (pathname.startsWith('/broadcast')) return 'Buyer groups';
  if (pathname.startsWith('/referrals')) return 'Invites';
  return null;
}

/**
 * Mobile-first shell: quiet header (no brand mark), glass bottom nav, elevated ＋.
 */
export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const company = useMyCompany();
  const unread = useUnreadCount();
  const chatUnread = useChatUnreadCount();
  const chatUnreadCount = chatUnread.data?.count ?? 0;
  const { buying, selling, trading, canPublish } = useTradePresence();
  const title = shellTitle(location.pathname);
  const isHome = location.pathname === '/';
  /** Thread detail: counterpart header owns the top chrome (WhatsApp-style). */
  const isChatThread = /^\/chats\/[^/]+/.test(location.pathname);

  const go = (path: string) => {
    setSheetOpen(false);
    navigate(path);
  };

  return (
    <div
      className={cx(
        'mx-auto flex w-full max-w-md flex-col bg-canvas',
        isChatThread ? 'h-full min-h-0 overflow-hidden' : 'min-h-full',
      )}
    >
      {!isChatThread ? (
        <header
          className={cx(
            'sticky top-0 z-20 flex items-center bg-canvas/95 px-4 py-2.5 backdrop-blur-md',
            isHome || title ? 'justify-between' : 'justify-end',
          )}
        >
          {title ? (
            <h1 className="text-lg font-bold tracking-tight text-ink">{title}</h1>
          ) : isHome ? (
            <span className="min-w-0 flex-1" aria-hidden />
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              aria-label="Notifications"
              className="relative rounded-full p-2 text-slate hover:bg-foam"
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
              type="button"
              aria-label="Profile and settings"
              className="rounded-full p-0.5"
              onClick={() => navigate('/more')}
            >
              <Avatar
                name={company.data?.name ?? 'E'}
                imageUrl={company.data?.logoUrl}
                size={36}
              />
            </button>
          </div>
        </header>
      ) : null}

      <main
        className={cx(
          'flex-1',
          isChatThread
            ? 'flex min-h-0 flex-col overflow-hidden px-0 pb-0 pt-0'
            : 'px-4 pb-28 pt-3',
        )}
      >
        {/* Rise only on route change — not on every local state update (filters, etc.). */}
        <div key={location.pathname} className={isChatThread ? 'flex min-h-0 flex-1 flex-col' : 'ekum-rise'}>
          <Suspense fallback={<LoadingBlock />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <nav className="ekum-glass fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-end justify-around border-t border-line/80 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
        {NAV.slice(0, 2).map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === '/chats' && chatUnreadCount > 0 ? chatUnreadCount : undefined}
          />
        ))}
        <button
          aria-label="Create"
          className="-mt-5 mb-1 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-soft)]"
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
          <Button variant="secondary" fullWidth onClick={() => go('/saved')}>
            Saved
          </Button>
          {buying ? (
            <Button variant="secondary" fullWidth onClick={() => go('/orders/new')}>
              Photo order
            </Button>
          ) : null}
          {selling ? (
            <>
              <Button variant="secondary" fullWidth onClick={() => go('/catalog/products/new')}>
                Add designs
              </Button>
              <Button variant="secondary" fullWidth onClick={() => go('/catalog/collections/new')}>
                New collection
              </Button>
              {trading ? (
                <Button variant="secondary" fullWidth onClick={() => go('/saved?select=1')}>
                  Curate pack
                </Button>
              ) : null}
              {canPublish ? (
                <Button variant="secondary" fullWidth onClick={() => go('/broadcast/new')}>
                  Broadcast to buyers
                </Button>
              ) : null}
            </>
          ) : null}
          <Button variant="secondary" fullWidth onClick={() => go('/referrals/new')}>
            Invite to connect
          </Button>
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
  badge,
}: {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  end: boolean;
  /** Teal count pill (chat unread) — not the orange notification style. */
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold tracking-tight',
          isActive ? 'text-accent' : 'text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              'relative flex h-8 w-8 items-center justify-center rounded-full',
              isActive && 'bg-foam',
            )}
          >
            <Icon width={22} height={22} />
            {badge != null && badge > 0 ? (
              <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
