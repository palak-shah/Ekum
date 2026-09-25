import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWA_UPDATE_MESSAGE = 'New version';
export const PWA_UPDATE_ACTION = 'Load';
/** While Ekum is on screen, notice a deploy without pull-to-refresh. */
export const PWA_UPDATE_CHECK_MS = 20 * 1000;
export const WEB_BUILD_STALE_EVENT = 'ekum:web-build-stale';

/** Bypass HTTP cache so a new `sw.js` on the server is seen (nginx/CDN). */
export async function refreshServiceWorker(
  registration: Pick<ServiceWorkerRegistration, 'update'>,
  swUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  try {
    await fetchImpl(swUrl, { cache: 'no-store' });
  } catch {
    // Offline — still ask the browser; it may have a waiting worker.
  }
  await registration.update();
}

/** Old Workbox shells intercept `/version.json` as the SPA. `/api/` is denylisted. */
export const WEB_BUILD_VERSION_URL = '/api/v1/web-build';
export const WEB_BUILD_VERSION_URL_FALLBACK = '/version.json';

export function clientWebBuild(): string {
  const fromEnv = import.meta.env.VITE_WEB_BUILD ?? '';
  if (fromEnv) return fromEnv;
  if (typeof document === 'undefined') return '';
  const meta = document.querySelector('meta[name="ekum-web-build"]')?.getAttribute('content');
  if (!meta || meta.startsWith('%VITE_')) return '';
  return meta;
}

async function readRemoteBuild(
  url: string,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  try {
    const res = await fetchImpl(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { build?: unknown };
    return typeof data.build === 'string' && data.build.length > 0 ? data.build : null;
  } catch {
    return null;
  }
}

/** Home Screen and a Safari tab each run this — SW update alone is not enough on iOS. */
export async function remoteWebBuildIsNewer(
  fetchImpl: typeof fetch = fetch,
  localBuild: string = clientWebBuild(),
): Promise<boolean> {
  if (!localBuild) return false;
  const remote =
    (await readRemoteBuild(WEB_BUILD_VERSION_URL, fetchImpl)) ??
    (await readRemoteBuild(WEB_BUILD_VERSION_URL_FALLBACK, fetchImpl));
  return Boolean(remote && remote !== localBuild);
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone) return true;
  return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches);
}

export function notifyIfServiceWorkerWaiting(
  registration: ServiceWorkerRegistration,
  onWaiting: () => void,
): void {
  if (registration.waiting) onWaiting();
  const track = (worker: ServiceWorker | null) => {
    if (!worker) return;
    const onState = () => {
      if (worker.state === 'installed' && navigator.serviceWorker?.controller) {
        onWaiting();
      }
    };
    worker.addEventListener('statechange', onState);
    onState();
  };
  track(registration.installing);
  track(registration.waiting);
  registration.addEventListener('updatefound', () => {
    track(registration.installing);
  });
}

export function bindUpdateRechecks(check: () => void): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') check();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', check);
  window.addEventListener('online', check);
  const interval = window.setInterval(() => {
    if (document.visibilityState === 'visible') check();
  }, PWA_UPDATE_CHECK_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', check);
    window.removeEventListener('pageshow', check);
    window.removeEventListener('online', check);
    window.clearInterval(interval);
  };
}

export function PwaUpdateBar({
  open,
  onLoad,
}: {
  open: boolean;
  onLoad: () => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-update-bar"
      className="fixed inset-x-0 top-[max(2.75rem,calc(0.5rem+env(safe-area-inset-top)))] z-[100] mx-auto flex max-w-md justify-center px-4"
    >
      <div className="flex max-w-full items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
        <p className="min-w-0">{PWA_UPDATE_MESSAGE}</p>
        <button
          type="button"
          className="shrink-0 underline decoration-white/70 underline-offset-2"
          onClick={onLoad}
        >
          {PWA_UPDATE_ACTION}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function PwaUpdateHost() {
  const [buildStale, setBuildStale] = useState(false);
  const [swWaiting, setSwWaiting] = useState(false);
  const unbindSwRechecks = useRef<(() => void) | null>(null);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      notifyIfServiceWorkerWaiting(registration, () => setSwWaiting(true));
      const check = () => {
        void refreshServiceWorker(registration, swUrl);
      };
      check();
      unbindSwRechecks.current?.();
      unbindSwRechecks.current = bindUpdateRechecks(check);
    },
  });

  useEffect(
    () => () => {
      unbindSwRechecks.current?.();
      unbindSwRechecks.current = null;
    },
    [],
  );

  useEffect(() => {
    const markStale = () => setBuildStale(true);
    const checkBuild = () => {
      void remoteWebBuildIsNewer().then((newer) => {
        if (newer) markStale();
      });
    };
    checkBuild();
    window.addEventListener(WEB_BUILD_STALE_EVENT, markStale);
    const unbind = bindUpdateRechecks(checkBuild);
    return () => {
      window.removeEventListener(WEB_BUILD_STALE_EVENT, markStale);
      unbind();
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onControllerChange = () => setSwWaiting(true);
    void navigator.serviceWorker.ready.then(() => {
      if (!navigator.serviceWorker.controller) return;
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    });
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const open = needRefresh || swWaiting || buildStale;

  return (
    <PwaUpdateBar
      open={open}
      onLoad={() => {
        if (needRefresh || swWaiting) {
          void updateServiceWorker(true);
        }
        window.location.reload();
      }}
    />
  );
}
