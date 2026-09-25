import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PWA_UPDATE_ACTION,
  PWA_UPDATE_MESSAGE,
  PwaUpdateBar,
  WEB_BUILD_VERSION_URL,
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
