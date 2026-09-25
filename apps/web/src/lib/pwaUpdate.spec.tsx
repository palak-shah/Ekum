import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PWA_UPDATE_ACTION,
  PWA_UPDATE_MESSAGE,
  PwaUpdateBar,
  WEB_BUILD_VERSION_URL,
  WEB_BUILD_STALE_FLAG,
  applyHomeScreenNewBuild,
  applyPwaUpdateLoad,
  homeScreenReloadBlocked,
  HS_RELOAD_KEY,
  bindUpdateRechecks,
  isStandaloneDisplay,
  peekWebBuildStaleFlag,
  notifyIfServiceWorkerWaiting,
  refreshServiceWorker,
  remoteWebBuildIsNewer,
} from './pwaUpdate';

describe('PwaUpdateBar', () => {
  it('hides until a new build is waiting', () => {
    render(<PwaUpdateBar open={false} onLoad={() => {}} />);
    expect(screen.queryByTestId('pwa-update-bar')).toBeNull();
  });

  it('asks to Load and does not reload until they tap', async () => {
    const onLoad = vi.fn();
    const user = userEvent.setup();
    render(<PwaUpdateBar open onLoad={onLoad} />);

    const bar = screen.getByTestId('pwa-update-bar');
    expect(bar).toHaveTextContent(PWA_UPDATE_MESSAGE);
    expect(screen.getByRole('button', { name: PWA_UPDATE_ACTION })).toBeTruthy();
    expect(onLoad).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: PWA_UPDATE_ACTION }));
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});

describe('refreshServiceWorker', () => {
  it('fetches sw.js without cache then asks the registration to update', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('ok'));
    const registration = { update: vi.fn().mockResolvedValue(undefined) };
    await refreshServiceWorker(registration, '/sw.js', fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith('/sw.js', { cache: 'no-store' });
    expect(registration.update).toHaveBeenCalledTimes(1);
  });
});

describe('remoteWebBuildIsNewer', () => {
  it('is true when the server build id differs (Safari tab and Home Screen)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ build: 'server-2' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await expect(remoteWebBuildIsNewer(fetchImpl, 'phone-1')).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(WEB_BUILD_VERSION_URL, { cache: 'no-store' });
  });

  it('is false when the open page already matches the server', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ build: 'same' }), { status: 200 }),
    );
    await expect(remoteWebBuildIsNewer(fetchImpl, 'same')).resolves.toBe(false);
  });
});

describe('notifyIfServiceWorkerWaiting', () => {
  it('fires when a worker is already waiting (Home Screen update)', () => {
    const onWaiting = vi.fn();
    const waiting = { state: 'installed', addEventListener: vi.fn() };
    notifyIfServiceWorkerWaiting(
      {
        waiting,
        installing: null,
        addEventListener: vi.fn(),
      } as unknown as ServiceWorkerRegistration,
      onWaiting,
    );
    expect(onWaiting).toHaveBeenCalled();
  });
});

describe('bindUpdateRechecks', () => {
  it('removes listeners and the interval on cleanup', () => {
    const check = vi.fn();
    const addDoc = vi.spyOn(document, 'addEventListener');
    const removeDoc = vi.spyOn(document, 'removeEventListener');
    const addWin = vi.spyOn(window, 'addEventListener');
    const removeWin = vi.spyOn(window, 'removeEventListener');
    const interval = window.setInterval(() => {}, 60_000);
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockReturnValue(interval);
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    const unbind = bindUpdateRechecks(check);
    expect(addDoc).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(addWin).toHaveBeenCalledWith('focus', check);
    expect(addWin).toHaveBeenCalledWith('pageshow', check);
    expect(addWin).toHaveBeenCalledWith('online', check);
    expect(setIntervalSpy).toHaveBeenCalled();

    unbind();
    expect(removeDoc).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWin).toHaveBeenCalledWith('focus', check);
    expect(removeWin).toHaveBeenCalledWith('pageshow', check);
    expect(removeWin).toHaveBeenCalledWith('online', check);
    expect(clearIntervalSpy).toHaveBeenCalledWith(interval);

    addDoc.mockRestore();
    removeDoc.mockRestore();
    addWin.mockRestore();
    removeWin.mockRestore();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    window.clearInterval(interval);
  });
});

describe('applyPwaUpdateLoad', () => {
  it('lets the waiting worker reload and does not race location.reload', () => {
    const updateServiceWorker = vi.fn();
    const reload = vi.fn();
    applyPwaUpdateLoad({
      needRefresh: true,
      swWaiting: false,
      updateServiceWorker,
      reload,
    });
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads the page when only the build id is stale', () => {
    const updateServiceWorker = vi.fn();
    const reload = vi.fn();
    applyPwaUpdateLoad({
      needRefresh: false,
      swWaiting: false,
      updateServiceWorker,
      reload,
    });
    expect(updateServiceWorker).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('peekWebBuildStaleFlag', () => {
  it('sees a stale signal set before React mounted', () => {
    const bag = window as Window & { [WEB_BUILD_STALE_FLAG]?: boolean };
    bag[WEB_BUILD_STALE_FLAG] = true;
    expect(peekWebBuildStaleFlag()).toBe(true);
    delete bag[WEB_BUILD_STALE_FLAG];
  });
});

describe('applyHomeScreenNewBuild', () => {
  it('drops caches and reloads once for a new build', async () => {
    const session = { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() };
    const drop = vi.fn().mockResolvedValue(undefined);
    const reload = vi.fn();
    await applyHomeScreenNewBuild({
      remoteBuild: 'b2',
      session,
      drop,
      reload,
    });
    expect(session.setItem).toHaveBeenCalledWith(HS_RELOAD_KEY, 'b2');
    expect(drop).toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not loop if this build was already applied', async () => {
    const session = { getItem: vi.fn().mockReturnValue('b2'), setItem: vi.fn() };
    const drop = vi.fn();
    const reload = vi.fn();
    await applyHomeScreenNewBuild({
      remoteBuild: 'b2',
      session,
      drop,
      reload,
    });
    expect(drop).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload on login or while a field is focused', async () => {
    const store = { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() };
    const drop = vi.fn();
    const reload = vi.fn();
    await applyHomeScreenNewBuild({
      remoteBuild: 'b3',
      store,
      drop,
      reload,
      blocked: true,
    });
    expect(store.setItem).not.toHaveBeenCalled();
    expect(drop).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('homeScreenReloadBlocked', () => {
  it('blocks OTP and login paths', () => {
    expect(homeScreenReloadBlocked({ pathname: '/login', active: document.body })).toBe(true);
    expect(homeScreenReloadBlocked({ pathname: '/onboarding', active: document.body })).toBe(true);
    expect(homeScreenReloadBlocked({ pathname: '/', active: document.body })).toBe(false);
  });

  it('blocks while they are typing in a field', () => {
    const input = document.createElement('input');
    expect(homeScreenReloadBlocked({ pathname: '/', active: input })).toBe(true);
  });
});

describe('isStandaloneDisplay', () => {
  it('is false in a normal browser tab', () => {
    expect(isStandaloneDisplay()).toBe(false);
  });
});
