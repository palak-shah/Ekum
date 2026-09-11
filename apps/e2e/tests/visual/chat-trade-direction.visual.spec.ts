import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const VIEW = { width: 390, height: 844 };
const OUT = join(process.cwd(), 'test-results', 'chat-trade-direction-390x844');

const CASES = [
  'in-inquiry',
  'out-inquiry',
  'in-order',
  'out-order',
  'in-quote',
  'out-quote',
  'out-updated',
  'out-dispatched',
] as const;

test.describe('chat trade direction surfaces @visual', () => {
  test.skip(!process.env.EKUM_VISUAL, 'Set EKUM_VISUAL=1 to recapture 390×844 shots');

  test('eight direction × status cards share one chrome rule', async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize(VIEW);
    await page.goto('/_visual/chat-trade-cards');
    await expect(page.getByTestId('chat-trade-direction-gallery')).toBeVisible();

    for (const id of CASES) {
      const section = page.locator(`[data-case="${id}"]`);
      await expect(section).toBeVisible();
      const card = section.locator('[data-testid="chat-trade-card"], [data-testid="chat-trade-card-pulse"]');
      const mine = await card.getAttribute('data-mine');
      const className = (await card.getAttribute('class')) ?? '';
      if (mine === 'true') {
        expect(className).toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
        expect(className).not.toMatch(/bg-surface/);
      } else {
        expect(className).toMatch(/bg-surface/);
        expect(className).not.toMatch(/(?:^|\s)bg-accent(?:\s|$)/);
      }
      await section.screenshot({ path: join(OUT, `${id}.png`) });
    }

    await page.screenshot({ path: join(OUT, 'all.png'), fullPage: true });
  });
});
