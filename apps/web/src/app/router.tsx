import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { RequireAuth } from './RequireAuth';
import { NotFoundPage, RouteErrorPage } from './RouteErrorPage';
import { AuthProvider } from '@/lib/auth';
import { LoginPage } from '@/features/auth/LoginPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { LoadingBlock } from '@/ui/kit';
import { ToastRoot } from '@/ui/Toast';

/**
 * Feature screens are code-split so the first paint (login/onboarding + shell)
 * ships a small bundle — important for the "old Android on 3G" target. Each route
 * suspends inside the shell's Suspense boundary while its chunk loads.
 */
function page<T extends Record<string, ComponentType<unknown>>>(
  loader: () => Promise<T>,
  name: keyof T,
) {
  return lazy(async () => ({ default: (await loader())[name] }));
}

const HomePage = page(() => import('@/features/home/HomePage'), 'HomePage');
const CollectionGrantsPage = page(
  () => import('@/features/home/CollectionGrantsPage'),
  'CollectionGrantsPage',
);
const ExplorePage = page(() => import('@/features/explore/ExplorePage'), 'ExplorePage');
const ExploreProductPage = page(
  () => import('@/features/explore/ExploreProductPage'),
  'ExploreProductPage',
);
const SearchPage = page(() => import('@/features/explore/SearchPage'), 'SearchPage');
const CompanyProfilePage = page(
  () => import('@/features/company/CompanyProfilePage'),
  'CompanyProfilePage',
);
const CollectionViewerPage = page(
  () => import('@/features/collections/CollectionViewerPage'),
  'CollectionViewerPage',
);
const ProductDetailPage = page(
  () => import('@/features/collections/ProductDetailPage'),
  'ProductDetailPage',
);
const OrdersPage = page(() => import('@/features/orders/OrdersPage'), 'OrdersPage');
const OrderBuilderPage = page(() => import('@/features/orders/OrderBuilderPage'), 'OrderBuilderPage');
const OrderInviteLandingPage = page(
  () => import('@/features/orders/OrderInviteLandingPage'),
  'OrderInviteLandingPage',
);
const OrderDetailPage = page(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage');
const SamplesPage = page(() => import('@/features/orders/SamplesPage'), 'SamplesPage');
const ReturnsPage = page(() => import('@/features/orders/ReturnsPage'), 'ReturnsPage');
const ChatsPage = page(() => import('@/features/chats/ChatsPage'), 'ChatsPage');
const ThreadPage = page(() => import('@/features/chats/ThreadPage'), 'ThreadPage');
const MyCatalogPage = page(() => import('@/features/catalog/MyCatalogPage'), 'MyCatalogPage');
const ProductEditorPage = page(
  () => import('@/features/catalog/ProductEditorPage'),
  'ProductEditorPage',
);
const DesignBatchPage = page(
  () => import('@/features/catalog/DesignBatchPage'),
  'DesignBatchPage',
);
const CollectionEditorPage = page(
  () => import('@/features/catalog/CollectionEditorPage'),
  'CollectionEditorPage',
);
const CuratePackPage = page(() => import('@/features/catalog/CuratePackPage'), 'CuratePackPage');
const MyBuyersPage = page(() => import('@/features/buyers/MyBuyersPage'), 'MyBuyersPage');
const NetworkPage = page(() => import('@/features/network/NetworkPage'), 'NetworkPage');
const FollowingPage = page(() => import('@/features/network/FollowingPage'), 'FollowingPage');
const FollowersPage = page(() => import('@/features/network/FollowersPage'), 'FollowersPage');
const ConnectionsPage = page(
  () => import('@/features/network/ConnectionsPage'),
  'ConnectionsPage',
);
const RequestsPage = page(() => import('@/features/network/RequestsPage'), 'RequestsPage');
const BroadcastPage = page(() => import('@/features/broadcast/BroadcastPage'), 'BroadcastPage');
const BroadcastComposePage = page(
  () => import('@/features/broadcast/BroadcastComposePage'),
  'BroadcastComposePage',
);
const ReferralsPage = page(() => import('@/features/referrals/ReferralsPage'), 'ReferralsPage');
const ReferralComposePage = page(
  () => import('@/features/referrals/ReferralComposePage'),
  'ReferralComposePage',
);
const ReferralLandingPage = page(
  () => import('@/features/referrals/ReferralLandingPage'),
  'ReferralLandingPage',
);
const NotificationsPage = page(
  () => import('@/features/notifications/NotificationsPage'),
  'NotificationsPage',
);
const SettingsPage = page(() => import('@/features/settings/SettingsPage'), 'SettingsPage');
const ProfilePage = page(() => import('@/features/settings/ProfilePage'), 'ProfilePage');
const YourPathsPage = page(() => import('@/features/settings/YourPathsPage'), 'YourPathsPage');
const MorePage = page(() => import('@/features/settings/MorePage'), 'MorePage');
const SavedPage = page(() => import('@/features/saved/SavedPage'), 'SavedPage');
const SelectionPage = page(() => import('@/features/browse/SelectionPage'), 'SelectionPage');
const StarredMessagesPage = page(
  () => import('@/features/chats/StarredMessagesPage'),
  'StarredMessagesPage',
);
const ChatTradeDirectionGalleryPage = page(
  () => import('@/features/chats/ChatTradeDirectionGalleryPage'),
  'ChatTradeDirectionGalleryPage',
);
const ShareLinkLandingPage = page(
  () => import('@/features/catalog/ShareLinkLandingPage'),
  'ShareLinkLandingPage',
);
const TeamPage = page(() => import('@/features/team/TeamPage'), 'TeamPage');
const TeamInviteLandingPage = page(
  () => import('@/features/team/TeamInviteLandingPage'),
  'TeamInviteLandingPage',
);

/** Auth sits in the route tree so HMR cannot detach Home from AuthProvider. */
function AppRoot() {
  return (
    <AuthProvider>
      <ToastRoot />
    </AuthProvider>
  );
}

/** Routing mirrors the settled navigation and the ~40-screen prototype. */
export const router = createBrowserRouter([
  {
    element: <AppRoot />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/s/:token', element: <ShareLinkLandingPage /> },
      {
        path: '/r/:token',
        element: (
          <Suspense fallback={<LoadingBlock label="Opening invite…" />}>
            <ReferralLandingPage />
          </Suspense>
        ),
      },
      {
        path: '/_visual/chat-trade-cards',
        element: (
          <Suspense fallback={<LoadingBlock label="Loading…" />}>
            <ChatTradeDirectionGalleryPage />
          </Suspense>
        ),
      },
      {
        path: '/t/:token',
        element: (
          <Suspense fallback={<LoadingBlock label="Opening invite…" />}>
            <TeamInviteLandingPage />
          </Suspense>
        ),
      },
      {
        element: <RequireAuth />,
        errorElement: <RouteErrorPage />,
        children: [
          {
            element: <AppShell />,
            errorElement: <RouteErrorPage />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'grants', element: <CollectionGrantsPage /> },
              { path: 'explore', element: <ExplorePage /> },
              { path: 'explore/products/:id', element: <ExploreProductPage /> },
              { path: 'search', element: <SearchPage /> },
              { path: 'company/:id', element: <CompanyProfilePage /> },
              { path: 'collections/:id', element: <CollectionViewerPage /> },
              { path: 'products/:id', element: <ProductDetailPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'orders/new', element: <OrderBuilderPage /> },
              { path: 'orders/:id', element: <OrderDetailPage /> },
              { path: 'o/:token', element: <OrderInviteLandingPage /> },
              { path: 'samples', element: <SamplesPage /> },
              { path: 'returns', element: <ReturnsPage /> },
              { path: 'chats', element: <ChatsPage /> },
              { path: 'chats/:id', element: <ThreadPage /> },
              { path: 'catalog', element: <MyCatalogPage /> },
              { path: 'catalog/curate', element: <CuratePackPage /> },
              { path: 'catalog/products/new', element: <DesignBatchPage /> },
              { path: 'catalog/products/:id', element: <ProductEditorPage /> },
              // `new` and real ids share :id so create→edit keeps one component instance.
              { path: 'catalog/collections/:id', element: <CollectionEditorPage /> },
              { path: 'buyers', element: <MyBuyersPage /> },
              { path: 'network', element: <NetworkPage /> },
              { path: 'network/following', element: <FollowingPage /> },
              { path: 'network/followers', element: <FollowersPage /> },
              { path: 'network/connections', element: <ConnectionsPage /> },
              { path: 'network/requests', element: <RequestsPage /> },
              { path: 'broadcast', element: <BroadcastPage /> },
              { path: 'broadcast/new', element: <BroadcastComposePage /> },
              { path: 'referrals', element: <ReferralsPage /> },
              { path: 'referrals/new', element: <ReferralComposePage /> },
              { path: 'notifications', element: <NotificationsPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'settings/profile', element: <ProfilePage /> },
              { path: 'settings/paths', element: <YourPathsPage /> },
              { path: 'team', element: <TeamPage /> },
              { path: 'saved', element: <SavedPage /> },
              { path: 'selection', element: <SelectionPage /> },
              { path: 'starred', element: <StarredMessagesPage /> },
              { path: 'more', element: <MorePage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
