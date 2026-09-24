/** Vitest stand-in for `virtual:pwa-register/react` (no service worker in unit tests). */
export function useRegisterSW(_options?: unknown) {
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: async () => {},
  };
}
