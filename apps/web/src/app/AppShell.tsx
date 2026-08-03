import { Outlet } from 'react-router-dom';

/**
 * The authenticated, mobile-first shell. The settled bottom navigation
 * (Home / Explore / + / Chats / Orders) and the adaptive + sheet are built out
 * in Milestone 8; this is the structural placeholder that everything past
 * onboarding renders inside.
 */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas">
      <main className="flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
