import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ContinuousCamera } from './ContinuousCamera';

describe('ContinuousCamera shell', () => {
  beforeEach(() => {
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
    expect(shell.className).toMatch(/h-dvh/);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
  });
});
