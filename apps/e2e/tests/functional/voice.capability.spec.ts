import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

/**
 * Voice / microphone:
 * - Full device mic + Safari empty-blob quirks need manual/device QA.
 * - Chromium can exercise the UI path with a synthetic AudioContext stream
 *   (not a mock of the upload API — MediaRecorder still produces a real blob).
 */
test.describe('voice input @functional @media @creation', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('order note mic: record synthetic audio until clip UI appears', async ({ page, context }) => {
    test.setTimeout(90_000);

    await context.grantPermissions(['microphone']);
    await page.addInitScript(() => {
      const devices = navigator.mediaDevices;
      const original = devices.getUserMedia.bind(devices);
      devices.getUserMedia = async (constraints) => {
        const wantsAudio =
          typeof constraints === 'object' &&
          constraints !== null &&
          'audio' in constraints &&
          Boolean((constraints as MediaStreamConstraints).audio);
        if (wantsAudio) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const dest = ctx.createMediaStreamDestination();
          osc.connect(dest);
          osc.start();
          return dest.stream;
        }
        return original(constraints as MediaStreamConstraints);
      };
    });

    await loginAsMeena(page);
    await page.goto('/orders/new');

    const mic = page.getByRole('button', { name: /Record voice note|Stop recording/ });
    await expect(mic).toBeVisible();
    await mic.click();
    await expect(page.getByText(/Recording/i)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Stop recording' }).click();

    // Upload may take a moment after MediaRecorder stops.
    await expect(page.getByRole('button', { name: 'Play voice' })).toBeVisible({
      timeout: 45_000,
    });
  });

  test('chat composer exposes hold-to-talk control', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');
    // Presence only — hold-to-talk + pointercancel is device-sensitive (manual QA).
    await expect(page.getByTestId('chat-voice')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Hold to record voice' })).toBeVisible();
  });
});
