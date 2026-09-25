import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWA_UPDATE_MESSAGE = 'New version';
export const PWA_UPDATE_ACTION = 'Load';
/** While Ekum is on screen, notice a deploy without pull-to-refresh. */
export const PWA_UPDATE_CHECK_MS = 20 * 1000;
export const WEB_BUILD_STALE_EVENT = 'ekum:web-build-stale';
export const WEB_BUILD_STALE_FLAG = '__ekumWebBuildStale';

export function peekWebBuildStaleFlag(): boolean {
  const bag = window as Window & { [WEB_BUILD_STALE_FLAG]?: boolean };
  return bag[WEB_BUILD_STALE_FLAG] === true;
}

export const HS_RELOAD_KEY = 'ekum-hs-reload';

const AUTH_PATHS = new Set(['/login', '/onboarding']);

/** Silent Home Screen reload must not steal the OTP field. */
export function homeScreenReloadBlocked(input?: {
  pathname?: string;
  active?: Element | null;
}): boolean {
  const path = input?.pathname ?? (typeof location !== 'undefined' ? location.pathname : '');
  if (AUTH_PATHS.has(path)) return true;
  const el = input?.active ?? (typeof document !== 'undefined' ? document.activeElement : null);
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean((el as HTMLElement).isContentEditable);
}

export async function dropControlledWebCaches(
  serviceWorker = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined,
  cacheStore = typeof window !== 'undefined' ? window.caches : undefined,
): Promise<void> {
  if (serviceWorker?.getRegistrations) {
    const regs = await serviceWorker.getRegistrations();
    await Promise.all(regs.map((registration) => registration.unregister()));
  }
  if (cacheStore?.keys) {
    const keys = await cacheStore.keys();
    await Promise.all(keys.map((key) => cacheStore.delete(key)));
  }
}

/** Home Screen has no Safari refresh — drop the worker cache and reload once. */
export async function applyHomeScreenNewBuild(input: {
  remoteBuild: string;
  store?: Pick<Storage, 'getItem' | 'setItem'>;
  session?: Pick<Storage, 'getItem' | 'setItem'>;
  reload: () => void;
  drop?: () => Promise<void>;
  blocked?: boolean;
}): Promise<void> {
  if (!input.remoteBuild) return;
  const blocked = input.blocked ?? homeScreenReloadBlocked();
  if (blocked) return;
  const store =
    input.store ??
    input.session ??
    (typeof localStorage !== 'undefined' ? localStorage : undefined);
  if (store?.getItem(HS_RELOAD_KEY) === input.remoteBuild) return;
  store?.setItem(HS_RELOAD_KEY, input.remoteBuild);
  await (input.drop ?? dropControlledWebCaches)();
  input.reload();
}

export function applyPwaUpdateLoad(input: {
  needRefresh: boolean;
  swWaiting: boolean;
  updateServiceWorker: (reloadPage?: boolean) => void;
  reload: () => void;
}): void {
  if (input.needRefresh || input.swWaiting) {
    input.updateServiceWorker(true);
    return;
  }
  input.reload();
}

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
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      notifyIfServiceWorkerWaiting(registration, () => setSwWaiting(true));
      // One fetch of sw.js on open — not every 20s, or skipWaiting would
      // reload the page while they are mid-quote. The pill uses version.json.
      void refreshServiceWorker(registration, swUrl);
    },
  });

  useEffect(() => {
    const markStale = () => setBuildStale(true);
    if (peekWebBuildStaleFlag()) markStale();
    const checkBuild = () => {
      void remoteWebBuildIsNewer().then((newer) => {
        if (newer) markStale();
      });
    };
    const tryHomeScreenApply = () => {
      if (!isStandaloneDisplay()) return;
      void (async () => {
        const remote =
          (await readRemoteBuild(WEB_BUILD_VERSION_URL, fetch)) ??
          (await readRemoteBuild(WEB_BUILD_VERSION_URL_FALLBACK, fetch));
        const local = clientWebBuild();
        if (remote && local && remote !== local) {
          await applyHomeScreenNewBuild({
            remoteBuild: remote,
            reload: () => window.location.reload(),
          });
        }
      })();
    };
    checkBuild();
    tryHomeScreenApply();
    window.addEventListener(WEB_BUILD_STALE_EVENT, markStale);
    const unbind = bindUpdateRechecks(() => {
      checkBuild();
      tryHomeScreenApply();
    });
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
        applyPwaUpdateLoad({
          needRefresh,
          swWaiting,
          updateServiceWorker,
          reload: () => window.location.reload(),
        });
      }}
    />
  );
}
