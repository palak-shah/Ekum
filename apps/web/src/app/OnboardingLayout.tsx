import type { ReactNode } from 'react';

/**
 * The bare layout for pre-app screens (login, onboarding). No bottom nav, no
 * distractions — a single job on screen. Matches LoginPage chrome (centered
 * column, safe areas, rise animation).
 */
export function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ekum-shell-scroll mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-y-auto bg-canvas px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="ekum-rise flex flex-1 flex-col justify-center">{children}</div>
    </div>
  );
}
