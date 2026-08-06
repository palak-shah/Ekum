import { lazy } from 'react';
import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { RequireAuth } from './RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';

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
const OrderDetailPage = page(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage');
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
const MyBuyersPage = page(() => import('@/features/buyers/MyBuyersPage'), 'MyBuyersPage');
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
const MorePage = page(() => import('@/features/settings/MorePage'), 'MorePage');

/** Routing mirrors the settled navigation and the ~40-screen prototype. */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'explore', element: <ExplorePage /> },
          { path: 'explore/products/:id', element: <ExploreProductPage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'company/:id', element: <CompanyProfilePage /> },
          { path: 'collections/:id', element: <CollectionViewerPage /> },
          { path: 'products/:id', element: <ProductDetailPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/new', element: <OrderBuilderPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'chats', element: <ChatsPage /> },
          { path: 'chats/:id', element: <ThreadPage /> },
          { path: 'catalog', element: <MyCatalogPage /> },
          { path: 'catalog/products/new', element: <DesignBatchPage /> },
          { path: 'catalog/products/:id', element: <ProductEditorPage /> },
          { path: 'catalog/collections/new', element: <CollectionEditorPage /> },
          { path: 'catalog/collections/:id', element: <CollectionEditorPage /> },
          { path: 'buyers', element: <MyBuyersPage /> },
          { path: 'broadcast', element: <BroadcastPage /> },
          { path: 'broadcast/new', element: <BroadcastComposePage /> },
          { path: 'referrals', element: <ReferralsPage /> },
          { path: 'referrals/new', element: <ReferralComposePage /> },
          { path: 'r/:token', element: <ReferralLandingPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/profile', element: <ProfilePage /> },
          { path: 'more', element: <MorePage /> },
        ],
      },
    ],
  },
]);
