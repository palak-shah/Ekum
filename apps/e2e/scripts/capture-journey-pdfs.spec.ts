import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { loginAs } from '../helpers/auth';
import { PHONES } from '../helpers/env';
import { accessTokenFromPage, createOrder } from '../helpers/orders';
import { resetTradeLanesToMe } from '../helpers/tradeLanes';

/**
 * Demo PDF capture against a live Compose stack (no local webServer).
 *
 * Prefer local Compose (yesterday’s work), not the Azure box:
 *   $env:EKUM_WEB_URL='http://localhost:8080'
 *   $env:EKUM_API_URL='http://localhost:8080/api/v1'
 *   pnpm --filter @ekum/e2e exec playwright test -c playwright.demo.config.ts
 */

const OUT_ROOT = path.resolve(__dirname, '../../../docs/demo-journeys');

type Shot = { file: string; title: string; note: string };

async function settle(page: Page, ms = 600) {
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

async function shot(page: Page, dir: string, shots: Shot[], file: string, title: string, note: string) {
  await settle(page);
  const filePath = path.join(dir, file);
  await page.screenshot({ path: filePath, fullPage: false });
  shots.push({ file: filePath, title, note });
}

async function buildPdf(page: Page, journey: string, persona: string, shots: Shot[], outPdf: string) {
  const slides = shots
    .map((s, i) => {
      const b64 = fs.readFileSync(s.file).toString('base64');
      return `
      <section class="slide">
        <div class="meta">
          <div class="kicker">${journey} · ${persona}</div>
          <h1>${i + 1}. ${s.title}</h1>
          <p>${s.note}</p>
        </div>
        <img src="data:image/png;base64,${b64}" alt="${s.title}" />
      </section>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 0; }
    .cover { page-break-after: always; padding-top: 48mm; }
    .cover h1 { font-size: 28px; margin: 0 0 8px; }
    .cover p { font-size: 14px; color: #444; line-height: 1.45; max-width: 420px; }
    .slide { page-break-after: always; }
    .slide:last-child { page-break-after: auto; }
    .meta { margin-bottom: 10px; }
    .kicker { font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: #666; margin-bottom: 4px; }
    h1 { font-size: 18px; margin: 0 0 4px; font-family: system-ui, sans-serif; }
    p { font-size: 12px; margin: 0; color: #444; font-family: system-ui, sans-serif; }
    img {
      display: block;
      width: 100%;
      max-height: 210mm;
      object-fit: contain;
      border: 1px solid #ddd;
      border-radius: 12px;
      background: #f6f6f6;
    }
  </style>
</head>
<body>
  <section class="cover">
    <div class="kicker">Ekum demo</div>
    <h1>${journey}</h1>
    <p>Persona: <strong>${persona}</strong>. Mobile screenshots from the live seed stack. Upload this PDF to ChatGPT to walk the product flow.</p>
  </section>
  ${slides}
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: outPdf,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });
}

async function softGoto(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page, 800);
}

test.describe('demo journey PDFs', () => {
  test('buyer + supplier + trader PDFs', async ({ page, browser }) => {
    fs.mkdirSync(OUT_ROOT, { recursive: true });

    // --- Buyer (Meena) ---
    {
      const dir = path.join(OUT_ROOT, 'buyer');
      fs.mkdirSync(dir, { recursive: true });
      const shots: Shot[] = [];

      await loginAs(page, PHONES.meena);
      await softGoto(page, '/');
      await shot(page, dir, shots, '01-home.png', 'Home', 'Meena (Jaipur Emporium) after login — buyer home.');

      await softGoto(page, '/explore');
      await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 20_000 });
      await shot(page, dir, shots, '02-explore.png', 'Explore', 'Browse packs and designs from connected sellers.');

      const wedding = page.getByRole('link', { name: /Wedding Edit/i }).first();
      if (await wedding.count()) {
        await wedding.click();
      } else {
        await page.getByText(/Wedding Edit/i).first().click();
      }
      await expect(page).toHaveURL(/\/collections\//, { timeout: 15_000 });
      await shot(page, dir, shots, '03-collection.png', 'Open a pack', 'Buyer opens a published collection (e.g. Wedding Edit).');

      const designTile = page.locator('button').filter({ has: page.locator('img') }).first();
      if (await designTile.count()) {
        await designTile.click({ button: 'right' });
        const selectAll = page.getByTestId('select-all-float-select-all');
        if (await selectAll.isVisible().catch(() => false)) {
          await selectAll.click();
          await shot(page, dir, shots, '04-select.png', 'Select designs', 'Long-press → select designs into the shortlist.');
        }
      }

      const bar = page.getByTestId('selection-workspace-bar');
      if (await bar.isVisible().catch(() => false)) {
        await bar.click();
        await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
          timeout: 15_000,
        });
        await shot(page, dir, shots, '05-selection.png', 'Your selection', 'Selection workspace: Order · Curate · Bookmark · Share.');

        const orderBtn = page.getByTestId('selection-order');
        if (await orderBtn.isVisible().catch(() => false)) {
          await orderBtn.click();
          await settle(page, 1000);
          await shot(page, dir, shots, '06-order-resolve.png', 'Order from selection', 'Resolve which designs/packs to order.');
        }
      }

      await softGoto(page, '/orders');
      await shot(page, dir, shots, '07-orders.png', 'Orders', 'Buyer orders feed (orders, samples, returns).');

      await softGoto(page, '/chats');
      await shot(page, dir, shots, '08-chats.png', 'Chats', 'Trade threads with sellers / traders.');

      await softGoto(page, '/more');
      await shot(page, dir, shots, '09-you.png', 'You', 'Personal hub — profile, network, saved, tools.');

      const pdfPage = await browser.newPage();
      await buildPdf(
        pdfPage,
        'Buyer journey',
        'Meena · Jaipur Emporium',
        shots,
        path.join(OUT_ROOT, 'ekum-buyer-journey.pdf'),
      );
      await pdfPage.close();
    }

    // --- Supplier (Kavita) ---
    {
      const dir = path.join(OUT_ROOT, 'supplier');
      fs.mkdirSync(dir, { recursive: true });
      const shots: Shot[] = [];

      await loginAs(page, PHONES.kavita);
      await softGoto(page, '/');
      await shot(page, dir, shots, '01-home.png', 'Home', 'Kavita (Ahmedabad Loom Co) — mill / supplier.');

      await softGoto(page, '/more');
      await shot(page, dir, shots, '02-you.png', 'You', 'Supplier hub into catalog and company tools.');

      await softGoto(page, '/catalog');
      await shot(page, dir, shots, '03-catalog.png', 'My catalog', 'Own designs and packs the mill sells.');

      await softGoto(page, '/collections/seed-col-1');
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
      await shot(page, dir, shots, '04-pack.png', 'Supplier pack', 'Seeded Wedding Edit pack owned by the mill.');

      await softGoto(page, '/catalog/collections/new');
      await settle(page, 1000);
      await shot(page, dir, shots, '05-new-collection.png', 'New collection', 'Create a pack from own designs.');

      const addDesigns = page.getByTestId('collection-add-designs');
      if (await addDesigns.isVisible().catch(() => false)) {
        await addDesigns.click();
        await settle(page, 800);
        await shot(page, dir, shots, '06-add-designs.png', 'Add designs', 'Pick designs from the mill library.');
        const done = page.getByRole('button', { name: 'Done' });
        if (await done.isVisible().catch(() => false)) {
          const firstTile = page
            .getByRole('dialog')
            .locator('button')
            .filter({ has: page.locator('img') })
            .first();
          if (await firstTile.count()) {
            await firstTile.click();
          }
          await done.click();
        }
        const nameField = page.getByLabel('Name');
        if (await nameField.isVisible().catch(() => false)) {
          await nameField.fill(`Demo drop ${Date.now()}`);
          const createPublish = page.getByRole('button', { name: /Create & Publish|Publish/i }).first();
          if (await createPublish.isVisible().catch(() => false)) {
            await createPublish.click();
            await settle(page, 1200);
            await shot(page, dir, shots, '07-publish-sheet.png', 'Publish', 'Choose who can see the pack, then publish.');
          }
        }
      }

      await softGoto(page, '/orders');
      await shot(page, dir, shots, '08-orders.png', 'Orders (selling)', 'Incoming buyer / trader tickets the mill fulfills.');

      await softGoto(page, '/explore');
      await shot(page, dir, shots, '09-explore.png', 'Explore', 'Supplier can also browse the network feed.');

      const pdfPage = await browser.newPage();
      await buildPdf(
        pdfPage,
        'Supplier journey',
        'Kavita · Ahmedabad Loom Co',
        shots,
        path.join(OUT_ROOT, 'ekum-supplier-journey.pdf'),
      );
      await pdfPage.close();
    }

    // --- Trader (Ravi) ---
    {
      const dir = path.join(OUT_ROOT, 'trader');
      fs.mkdirSync(dir, { recursive: true });
      const shots: Shot[] = [];

      await loginAs(page, PHONES.ravi);
      const raviToken = await accessTokenFromPage(page);
      await resetTradeLanesToMe(page.request, raviToken).catch(() => undefined);

      await softGoto(page, '/');
      await shot(page, dir, shots, '01-home.png', 'Home', 'Ravi (Surat Silk House) — trader desk persona.');

      await softGoto(page, '/explore');
      await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 20_000 });
      await page.evaluate(() => {
        sessionStorage.setItem(
          'ekum:browseAlbumPick',
          JSON.stringify([
            {
              collectionId: 'seed-col-1',
              name: 'Wedding Edit',
              coverImage: null,
              companyId: 'seed-company-kavita',
              companyName: 'Ahmedabad Loom Co',
              productCount: 3,
              allowForward: true,
            },
          ]),
        );
        sessionStorage.setItem(
          'ekum:browseShortlist',
          JSON.stringify([
            {
              productId: 'seed-prod-1',
              name: 'Design A',
              thumbUrl: null,
              companyId: 'seed-company-kavita',
              companyName: 'Ahmedabad Loom Co',
              allowForward: true,
            },
          ]),
        );
      });
      await page.reload();
      await settle(page, 1000);
      await shot(page, dir, shots, '02-explore-selection.png', 'Explore + selection', 'Trader shortlists supplier packs/designs.');

      if (await page.getByTestId('selection-workspace-bar').isVisible().catch(() => false)) {
        await page.getByTestId('selection-workspace-bar').click();
        await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
          timeout: 15_000,
        });
        await shot(page, dir, shots, '03-selection.png', 'Your selection', 'Trader actions: Order, Curate, Bookmark, Share.');

        await page.getByTestId('selection-curate').click();
        await settle(page, 1000);
        await shot(page, dir, shots, '04-curate-resolve.png', 'Curate from collections', 'Build a pack from supplier designs for own buyers.');
      }

      await softGoto(page, '/orders');
      await shot(page, dir, shots, '05-orders.png', 'Orders', 'Unified orders feed.');

      // Seed an I-handle ticket so the desk looks real.
      await loginAs(page, PHONES.meena);
      const meenaToken = await accessTokenFromPage(page);
      const created = await createOrder(page.request, meenaToken, {
        sellerCompanyId: 'seed-company-ravi',
        orderPathPreference: 'handle',
        items: [{ productId: 'seed-prod-fabric-1', quantity: 20 }],
      });

      await loginAs(page, PHONES.ravi);
      await softGoto(page, '/orders');
      const filter = page.getByTestId('orders-filter');
      if (await filter.isVisible().catch(() => false)) {
        await filter.click();
        const typeOpen = page.getByTestId('orders-filter-open-type');
        if (await typeOpen.isVisible().catch(() => false)) {
          await typeOpen.click();
          await page.getByTestId('orders-filter-type-trading').click();
          await settle(page, 800);
        } else {
          await page.keyboard.press('Escape');
        }
      }
      await shot(page, dir, shots, '06-orders-trading.png', 'Trading filter', 'I-handle tickets the trader manages for buyers.');

      await softGoto(page, `/orders/${created.id}`);
      await settle(page, 1200);
      await shot(page, dir, shots, '07-desk.png', 'Trader desk', 'Buyer ticket with mill subsets — Send / quote path.');

      await softGoto(page, '/settings/paths');
      await settle(page, 1000);
      await shot(page, dir, shots, '08-your-paths.png', 'Your paths', 'Default ticket path per buyer/seller pair (Me / Mill).');

      await softGoto(page, '/catalog');
      await shot(page, dir, shots, '09-catalog.png', 'Catalog', 'Trader also sells own Surat Silk House catalog.');

      await softGoto(page, '/more');
      await shot(page, dir, shots, '10-you.png', 'You', 'Trader hub — paths, network, catalog, saved.');

      const pdfPage = await browser.newPage();
      await buildPdf(
        pdfPage,
        'Trader journey',
        'Ravi · Surat Silk House',
        shots,
        path.join(OUT_ROOT, 'ekum-trader-journey.pdf'),
      );
      await pdfPage.close();
    }

    const summary = [
      path.join(OUT_ROOT, 'ekum-buyer-journey.pdf'),
      path.join(OUT_ROOT, 'ekum-supplier-journey.pdf'),
      path.join(OUT_ROOT, 'ekum-trader-journey.pdf'),
    ];
    for (const p of summary) {
      expect(fs.existsSync(p), `missing ${p}`).toBeTruthy();
    }
    // eslint-disable-next-line no-console
    console.log('Wrote PDFs:\n' + summary.join('\n'));
  });
});
