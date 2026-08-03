import type { ReactNode } from 'react';

/**
 * The bare layout for pre-app screens (login, onboarding). No bottom nav, no
 * distractions — a single job on screen.
 */
export function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center bg-canvas px-6 py-10">
      {children}
    </div>
  );
}
