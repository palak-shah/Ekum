import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { resetMediaSessionForTests } from '@/lib/mediaSession';
import { ContinuousCamera } from './ContinuousCamera';

describe('ContinuousCamera shell', () => {
  beforeEach(() => {
    resetMediaSessionForTests();
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn(() =>
          Promise.reject(new Error('no camera in unit test')),
        ),
      },
    });
  });

  afterEach(() => {
    cleanup();
    resetMediaSessionForTests();
    vi.unstubAllGlobals();
  });

  it('portals fullscreen shell to document.body (escapes AppShell max-w-md)', async () => {
    const onUnavailable = vi.fn();
    render(
      // Mimic AppShell trapping: transform + narrow column.
      <div className="ekum-rise mx-auto w-80 max-w-md" style={{ transform: 'translateY(0)' }}>
        <ContinuousCamera
          open
          maxShots={3}
          onDone={() => undefined}
          onCancel={() => undefined}
          onUnavailable={onUnavailable}
        />
      </div>,
    );

    const shell = await screen.findByTestId('continuous-camera');
    expect(shell.parentElement).toBe(document.body);
    expect(shell.className).toMatch(/fixed/);
    expect(shell.className).toMatch(/inset-0/);
    expect(shell.className).toMatch(/overflow-hidden/);
    expect(shell.className).toMatch(/100dvh/);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
    expect(screen.getByTestId('continuous-camera-shutter')).toBeTruthy();
  });

  it('does not re-call getUserMedia when onUnavailable identity changes while open', async () => {
    const track = {
      kind: 'video',
      readyState: 'live' as MediaStreamTrackState,
      enabled: true,
      stop: vi.fn(),
      getCapabilities: () => ({}),
      applyConstraints: vi.fn(async () => undefined),
    };
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
      getAudioTracks: () => [],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn(async () => stream);
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: { getUserMedia },
    });

    HTMLMediaElement.prototype.play = vi.fn(async () => undefined);

    const { rerender } = render(
      <ContinuousCamera
        open
        maxShots={3}
        onDone={() => undefined}
        onCancel={() => undefined}
        onUnavailable={() => undefined}
      />,
    );

    await screen.findByTestId('continuous-camera');
    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));

    rerender(
      <ContinuousCamera
        open
        maxShots={3}
        onDone={() => undefined}
        onCancel={() => undefined}
        onUnavailable={() => undefined}
      />,
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });
});
