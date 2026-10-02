import { Suspense, useEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useChatUnreadCount, useMyCompany, useOrdersNeedsYouCount, useUnreadCount } from '@/lib/queries';
import { ordersNavAriaLabel, tabCountBadge, tabCountLabel } from './navCountBadge';
import { useTeamCaps } from '@/lib/teamCaps';
import { useTradePresence } from '@/lib/tradePresence';
import { cx } from '@/ui/kit';
import { SHELL_X_CONTAIN_CLASS } from '@/ui/mobileOverflow';
import { SelectionWorkspaceBar } from '@/features/browse/SelectionWorkspaceBar';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  companyIdFromPath,
  shouldHideAppNav,
  shopSelectedCount,
} from '@/features/company/shopTradeDock';
import {
  getPageOwnsBottomBand,
  subscribePageOwnsBottomBand,
} from '@/features/browse/selectionBottomBand';
import { noteOrdersPathChange } from '@/features/orders/ordersDirectionSession';
import {
  getOrderActionDockNavVisible,
  subscribeOrderActionDockNav,
} from '@/features/orders/orderActionDockNav';
import { CreateCollectionFabSheet } from './CreateCollectionFabSheet';
import { createFabHref, createFabIntent, CREATE_FAB_EXPLAIN } from './createFabIntent';
import { pageOwnsTopChrome, shellShowsHomeBack, shellTitle } from './shellTitle';
import { useToast } from '@/ui/Toast';
import {
  chatsInboxHref,
  getRememberedChatsInbox,
  subscribeRememberedChatsInbox,
} from '@/features/chats/chatsInboxFilter';
import { ChatsHeaderMore } from '@/features/chats/ChatsHeaderMore';
import { ChatsHeaderNew } from '@/features/chats/ChatsHeaderNew';
import { HomeAccountMenu } from '@/features/home/HomeAccountMenu';
import {
  BackIcon,
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
 * Mobile-first shell: quiet header (no brand mark), glass bottom nav, centred ＋.
 */
export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const { session } = useAuth();
  const company = useMyCompany();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const unread = useUnreadCount();
  const chatUnread = useChatUnreadCount();
  const chatUnreadCount = chatUnread.data?.count ?? 0;
  const ordersNeedsYou = useOrdersNeedsYouCount();
  const ordersNeedsYouCount = ordersNeedsYou.data?.count ?? 0;
  const { buying, selling } = useTradePresence();
  const { can } = useTeamCaps();
  const fabIntent = createFabIntent({
    selling,
    buying,
    canUploads: can('uploads'),
    canOrders: can('orders'),
  });
  const title = shellTitle(location.pathname);
  const showHomeBack = shellShowsHomeBack(location.pathname);
  const isHome = location.pathname === '/';
  const ownsTopChrome = pageOwnsTopChrome(location.pathname);
  const isChatThread =
    /^\/chats\/[^/]+/.test(location.pathname) && location.pathname !== '/chats/archived';
  const shopId = companyIdFromPath(location.pathname);
  const chatsInbox = useSyncExternalStore(
    subscribeRememberedChatsInbox,
    getRememberedChatsInbox,
    getRememberedChatsInbox,
  );
  const orderDockHidesNav = useSyncExternalStore(
    subscribeOrderActionDockNav,
    getOrderActionDockNavVisible,
    getOrderActionDockNavVisible,
  );
  const pageDockUp = useSyncExternalStore(subscribePageOwnsBottomBand, getPageOwnsBottomBand);
  const hideAppNav =
    shouldHideAppNav(location.pathname, {
      myCompanyId: company.data?.id,
      thisShopSelectedCount: shopId
        ? shopSelectedCount(shortlist.entries, albumPick.entries, shopId)
        : 0,
      search: location.search,
      pageDockUp,
    }) || orderDockHidesNav;
  const wasOrdersPath = useRef(false);

  useEffect(() => {
    wasOrdersPath.current = noteOrdersPathChange(location.pathname, wasOrdersPath.current);
  }, [location.pathname]);

  const onCreate = () => {
    if (fabIntent === 'collection') {
      setCreateOpen(true);
      return;
    }
    const href = createFabHref(fabIntent);
    if (href) {
      navigate(href);
      return;
    }
    showToast(CREATE_FAB_EXPLAIN, 'danger');
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
            title ? 'justify-between' : 'justify-end',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            {showHomeBack ? (
              <button
                type="button"
                aria-label="Back"
                data-testid="you-back-home"
                className="-ml-1.5 rounded-full p-1.5 text-ink hover:bg-foam"
                onClick={() => navigate('/')}
              >
                <BackIcon />
              </button>
            ) : null}
            {title ? (
              <h1 className="truncate text-[1.375rem] font-semibold tracking-[-0.03em] text-ink">
                {title}
              </h1>
            ) : (
              <span className="min-w-0 flex-1" aria-hidden />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {location.pathname === '/chats' ? (
              <>
                <ChatsHeaderMore />
                <ChatsHeaderNew />
              </>
            ) : null}
            {isHome ? (
              <>
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
                      {tabCountLabel(unread.data.count)}
                    </span>
                  ) : null}
                </button>
                <HomeAccountMenu
                  name={company.data?.name ?? session?.user.name ?? 'E'}
                  imageUrl={company.data?.logoUrl}
                />
              </>
            ) : null}
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

      <CreateCollectionFabSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onPick={(href) => navigate(href)}
      />

      <nav
        data-testid="app-bottom-nav"
        hidden={hideAppNav}
        className={cx(
          'ekum-glass fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md items-center justify-around border-t border-line px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1',
          hideAppNav && 'pointer-events-none hidden',
        )}
      >
        {NAV.slice(0, 2).map((item) => (
          <NavItem
            key={item.label}
            {...item}
            to={item.label === 'Chats' ? chatsInboxHref(chatsInbox) : item.to}
            badge={item.to === '/chats' && chatUnreadCount > 0 ? chatUnreadCount : undefined}
          />
        ))}
        {/* Stretch to the tab column height and centre the 48px ＋ (not top-aligned to the 32px icons). */}
        <div className="flex min-w-0 flex-1 items-center justify-center self-stretch">
          <button
            type="button"
            data-testid="app-create-fab"
            aria-label="Create"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white"
            onClick={onCreate}
          >
            <PlusIcon width={28} height={28} />
          </button>
        </div>
        {NAV.slice(2).map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === '/orders' ? tabCountBadge(ordersNeedsYouCount) : undefined}
            ariaLabel={
              item.to === '/orders' ? ordersNavAriaLabel(ordersNeedsYouCount) : undefined
            }
          />
        ))}
      </nav>
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
  ariaLabel,
}: {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  end: boolean;
  /** Teal count pill (chat unread / orders Need you) — not the orange notification style. */
  badge?: number;
  ariaLabel?: string;
}) {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={ariaLabel ?? label}
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
              <span
                aria-hidden
                className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white"
              >
                {tabCountLabel(badge)}
              </span>
            ) : null}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
