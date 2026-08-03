import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomePage } from '@/features/home/HomePage';

/**
 * Routing mirrors the settled navigation. Only Home exists at Milestone 1;
 * Explore, Chats, Orders and their detail routes are added in Milestone 8.
 */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);
