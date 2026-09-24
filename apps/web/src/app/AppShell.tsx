import { Suspense, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useChatUnreadCount, useMyCompany, useUnreadCount } from '@/lib/queries';
import { useTeamCaps } from '@/lib/teamCaps';
import { useTradePresence } from '@/lib/tradePresence';
import { Avatar, Button, Sheet, cx } from '@/ui/kit';
import { SHELL_X_CONTAIN_CLASS } from '@/ui/mobileOverflow';
import { SelectionWorkspaceBar } from '@/features/browse/SelectionWorkspaceBar';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  companyIdFromPath,
  shouldHideAppNav,
  shopSelectedCount,
} from '@/features/company/shopTradeDock';
import { noteOrdersPathChange } from '@/features/orders/ordersDirectionSession';
import { ChatsHeaderMore } from '@/features/chats/ChatsHeaderMore';
import { YouHeaderMore } from '@/features/settings/YouHeaderMore';
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
  if (pathname.startsWith('/team')) return 'Team';
  if (pathname === '/more') return 'You';
  if (pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
    // Nested settings use PageHeader — hide shell title to avoid a second band.
    return null;
  }
  if (pathname.startsWith('/buyers') || pathname.startsWith('/network')) return 'Network';
  if (pathname.startsWith('/following') || pathname.startsWith('/followers')) return 'Network';
  // Create/edit under /catalog/* use PageHeader; list is also PageHeader (like Saved).
  if (pathname.startsWith('/catalog')) return null;
  if (pathname.startsWith('/company')) return 'Business';
  if (pathname.startsWith('/collections')) return 'Collection';
  if (pathname.startsWith('/products')) return 'Design';
  if (pathname.startsWith('/broadcast')) return 'Buyer groups';
  if (pathname.startsWith('/referrals')) return 'Invites';
  return null;
}

/**
 * Detail / create flows use PageHeader (back + title). Hiding the shell band
 * keeps that header flush to the top — same real estate rule as a chat thread.
 */
function pageOwnsTopChrome(pathname: string): boolean {
  if (/^\/chats\/[^/]+/.test(pathname)) return true;
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return true;
  if (pathname.startsWith('/broadcast')) return true;
  if (pathname.startsWith('/referrals')) return true;
  if (pathname.startsWith('/saved')) return true;
  if (pathname.startsWith('/selection')) return true;
  if (pathname.startsWith('/settings')) return true;
  if (pathname === '/orders/new' || pathname.startsWith('/orders/new/')) return true;
  if (/^\/orders\/[^/]+/.test(pathname)) return true;
  if (/^\/collections\//.test(pathname)) return true;
  if (/^\/products\//.test(pathname)) return true;
  if (/^\/company\//.test(pathname)) return true;
  return false;
}

/**
 * Mobile-first shell: quiet header (no brand mark), glass bottom nav, elevated ＋.
 */
export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, startTransition] = useTransition();
  const { session } = useAuth();
  const company = useMyCompany();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const unread = useUnreadCount();
  const chatUnread = useChatUnreadCount();
  const chatUnreadCount = chatUnread.data?.count ?? 0;
  const { buying, selling } = useTradePresence();
  const { can } = useTeamCaps();
  const title = shellTitle(location.pathname);
  const isHome = location.pathname === '/';
  const ownsTopChrome = pageOwnsTopChrome(location.pathname);
  const isChatThread =
    /^\/chats\/[^/]+/.test(location.pathname) && location.pathname !== '/chats/archived';
  const shopId = companyIdFromPath(location.pathname);
  const hideAppNav = shouldHideAppNav(location.pathname, {
    myCompanyId: company.data?.id,
    thisShopSelectedCount: shopId
      ? shopSelectedCount(shortlist.entries, albumPick.entries, shopId)
      : 0,
  });
  const wasOrdersPath = useRef(false);

  useEffect(() => {
    wasOrdersPath.current = noteOrdersPathChange(location.pathname, wasOrdersPath.current);
  }, [location.pathname]);

  const go = (path: string) => {
    setSheetOpen(false);
    startTransition(() => navigate(path));
  };

  return (
    <div
      className={cx(
        'mx-auto flex w-full max-w-md flex-col bg-canvas',
        SHELL_X_CONTAIN_CLASS,
        ownsTopChrome ? 'h-full min-h-0 overflow-hidden' : 'min-h-full',
      )}
    >
      {!ownsTopChrome ? (
        <header
          className={cx(
            'sticky top-0 z-20 flex items-center border-b border-line bg-canvas px-4 py-2.5',
            isHome || title ? 'justify-between' : 'justify-end',
          )}
        >
          {title ? (
            <h1 className="text-[1.375rem] font-semibold tracking-[-0.03em] text-ink">{title}</h1>
          ) : isHome ? (
            <span className="min-w-0 flex-1" aria-hidden />
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
          <div className="flex shrink-0 items-center gap-0.5">
            {location.pathname === '/chats' ? <ChatsHeaderMore /> : null}
            {location.pathname === '/more' ? <YouHeaderMore /> : null}
            <button
              type="button"
              data-testid="notifications-bell"
              aria-label="Notifications"
              className="relative rounded-full p-2 text-slate hover:bg-foam"
              onClick={() => startTransition(() => navigate('/notifications'))}
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
              onClick={() => startTransition(() => navigate('/more'))}
            >
              <Avatar
                name={company.data?.name ?? session?.user.name ?? 'E'}
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
          SHELL_X_CONTAIN_CLASS,
          isChatThread
            ? 'flex min-h-0 flex-col overflow-hidden px-0 pb-0 pt-0'
            : ownsTopChrome
              ? // Hide rail like chat — PageHeader pages scroll in main on a mobile shell.
                cx(
                  'ekum-no-scrollbar min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-0',
                  hideAppNav ? 'pb-8' : 'pb-28',
                )
              : hideAppNav
                ? 'px-4 pb-8 pt-3'
                : 'px-4 pb-28 pt-3',
        )}
      >
        {/*
          Keep Suspense stable across routes. Keying the Suspense parent remounted it
          and flashed LoadingBlock on every lazy navigate (Explore → Selection, etc.).
          Rise only remounts the page body after the chunk is ready.
        */}
        <Suspense fallback={null}>
          <RouteBody isChatThread={isChatThread} pathname={location.pathname}>
            <Outlet />
          </RouteBody>
        </Suspense>
      </main>

      <SelectionWorkspaceBar />

      <nav
        data-testid="app-bottom-nav"
        hidden={hideAppNav}
        className={cx(
          'ekum-glass fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md items-end justify-around border-t border-line px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1',
          hideAppNav && 'hidden',
        )}
      >
        {NAV.slice(0, 2).map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === '/chats' && chatUnreadCount > 0 ? chatUnreadCount : undefined}
          />
        ))}
        <button
          aria-label="Create"
          className="mb-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white"
          onClick={() => {
            if (selling && can('uploads')) {
              setSheetOpen(true);
              return;
            }
            if (buying && can('orders')) {
              navigate('/orders');
            }
          }}
        >
          <PlusIcon width={26} height={26} />
        </button>
        {NAV.slice(2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="New">
        <div className="flex flex-col gap-2">
          {selling ? (
            <>
              {can('uploads') ? (
                <>
                  <Button variant="secondary" fullWidth onClick={() => go('/catalog/products/new')}>
                    Add designs
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => go('/catalog/collections/new')}>
                    New collection
                  </Button>
                </>
              ) : null}
              {/* Curate lives on Your selection (and Saved select) — not a ＋ create action. */}
            </>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}

function RouteBody({
  pathname,
  isChatThread,
  children,
}: {
  pathname: string;
  isChatThread: boolean;
  children: ReactNode;
}) {
  return (
    <div
      key={pathname}
      className={isChatThread ? 'flex min-h-0 flex-1 flex-col' : 'ekum-rise'}
    >
      {children}
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
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  return (
    <NavLink
      to={to}
      end={end}
      onClick={(event) => {
        // Keep prior screen painted while the next lazy chunk loads (no Suspense flash).
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        startTransition(() => navigate(to));
      }}
      className={({ isActive }) =>
        cx(
          'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium tracking-tight',
          isActive ? 'text-accent' : 'text-slate',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              'relative flex h-8 w-8 items-center justify-center rounded-lg',
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
