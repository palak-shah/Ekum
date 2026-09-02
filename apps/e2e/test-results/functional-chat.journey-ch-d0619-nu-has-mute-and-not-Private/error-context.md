# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: functional\chat.journey.spec.ts >> chat journey @functional @chat >> owner more menu has mute and not Private
- Location: tests\functional\chat.journey.spec.ts:68:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByTestId('thread-more')

```

# Page snapshot

```yaml
- generic [ref=f2e2]:
  - heading "Unexpected Application Error!" [level=2] [ref=f2e3]
  - heading "counterpartId is not defined" [level=3] [ref=f2e4]
  - generic [ref=f2e5]: "ReferenceError: counterpartId is not defined at ThreadPage (http://127.0.0.1:5173/src/features/chats/ThreadPage.tsx?t=1788277119747:850:18) at Object.react_stack_bottom_frame (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:18509:20) at renderWithHooks (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:5654:24) at updateFunctionComponent (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:7475:21) at beginWork (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:8525:20) at runWithFiberInDEV (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:997:72) at performUnitOfWork (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:12561:98) at workLoopSync (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:12424:43) at renderRootSync (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:12408:13) at performWorkOnRoot (http://127.0.0.1:5173/node_modules/.vite/deps/react-dom_client.js?v=908a9f33:11827:37)"
  - paragraph [ref=f2e6]: 💿 Hey developer 👋
  - paragraph [ref=f2e7]:
    - text: You can provide a way better UX than this when your app throws errors by providing your own
    - code [ref=f2e8]: ErrorBoundary
    - text: or
    - code [ref=f2e9]: errorElement
    - text: prop on your route.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAsMeena } from '../../helpers/persona';
  3  | 
  4  | test.describe('chat journey @functional @chat', () => {
  5  |   test('send text and use in-thread search scopes + stepper', async ({ page }) => {
  6  |     await loginAsMeena(page);
  7  |     await page.goto('/chats/seed-thread-1');
  8  | 
  9  |     const marker = `func-chat-${Date.now()}`;
  10 |     await page.getByTestId('chat-composer').fill(marker);
  11 |     await page.getByTestId('chat-send').click();
  12 |     await expect(page.getByText(marker)).toBeVisible();
  13 | 
  14 |     await page.getByTestId('thread-search-toggle').click();
  15 |     await expect(page.getByTestId('thread-search-band')).toBeVisible();
  16 | 
  17 |     await page.getByRole('button', { name: 'Orders', exact: true }).click();
  18 |     await expect(page.getByTestId('thread-search-band')).toBeVisible();
  19 | 
  20 |     await page.getByRole('button', { name: 'Photos', exact: true }).click();
  21 |     await expect(page.getByTestId('thread-search-band')).toBeVisible();
  22 | 
  23 |     await page.getByRole('button', { name: 'Designs', exact: true }).click();
  24 |     await expect(page.getByTestId('thread-search-band')).toBeVisible();
  25 | 
  26 |     await page.getByRole('button', { name: 'All', exact: true }).click();
  27 |     await page.getByTestId('thread-search-input').fill(marker);
  28 |     await expect(page.getByTestId('thread-search-hit-count')).toBeVisible({ timeout: 10_000 });
  29 |     await expect(page.getByTestId('thread-search-hit-count')).toHaveText(/1 of 1|of \d+/);
  30 |   });
  31 | 
  32 |   test('attach design picker has search and multi-select send', async ({ page }) => {
  33 |     await loginAsMeena(page);
  34 |     await page.goto('/chats/seed-thread-1');
  35 | 
  36 |     await page.getByTestId('chat-attach').click();
  37 |     await expect(page.getByRole('heading', { name: 'Share in chat' })).toBeVisible();
  38 |     await page.getByRole('button', { name: /Design/ }).first().click();
  39 |     await expect(page.getByRole('heading', { name: 'Share a design' })).toBeVisible();
  40 | 
  41 |     await expect(page.getByTestId('attach-back')).toBeVisible();
  42 |     await expect(page.getByTestId('attach-back')).toHaveAttribute('aria-label', 'Back');
  43 |     await expect(page.getByTestId('attach-search')).toBeVisible();
  44 | 
  45 |     const rows = page.getByTestId('attach-design-row');
  46 |     await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  47 |     await expect(page.getByTestId('attach-select-all')).toBeVisible();
  48 |     await expect(page.getByTestId('attach-select-all-action')).toHaveText('Select all');
  49 | 
  50 |     const count = await rows.count();
  51 |     await page.getByTestId('attach-select-all-action').click();
  52 |     await expect(page.getByTestId('attach-select-all-action')).toHaveText('Clear');
  53 |     await expect(page.getByRole('button', { name: new RegExp(`Send \\(${count}\\)`) })).toBeVisible();
  54 | 
  55 |     if (count >= 2) {
  56 |       await page.getByRole('button', { name: new RegExp(`Send \\(${count}\\)`) }).click();
  57 |       await expect(page.getByRole('heading', { name: 'Share a design' })).toBeHidden({
  58 |         timeout: 15_000,
  59 |       });
  60 |     } else if (count === 1) {
  61 |       await page.getByRole('button', { name: /Send \(1\)/ }).click();
  62 |       await expect(page.getByRole('heading', { name: 'Share a design' })).toBeHidden({
  63 |         timeout: 15_000,
  64 |       });
  65 |     }
  66 |   });
  67 | 
  68 |   test('owner more menu has mute and not Private', async ({ page }) => {
  69 |     await loginAsMeena(page);
  70 |     await page.goto('/chats/seed-thread-1');
  71 | 
> 72 |     await page.getByTestId('thread-more').click();
     |                                           ^ Error: locator.click: Test timeout of 60000ms exceeded.
  73 |     await expect(page.getByTestId('thread-more-menu')).toBeVisible({ timeout: 15_000 });
  74 |     await expect(page.getByTestId('thread-pin')).toBeVisible();
  75 |     await expect(page.getByTestId('thread-mute')).toBeVisible();
  76 |     await expect(page.getByTestId('thread-open-private')).toHaveCount(0);
  77 |     await expect(page.getByText('Private')).toHaveCount(0);
  78 |   });
  79 | 
  80 |   test('plus sheet is New chat without Private', async ({ page }) => {
  81 |     await loginAsMeena(page);
  82 |     await page.goto('/chats');
  83 |     await page.getByRole('button', { name: 'New chat' }).click();
  84 |     await expect(page.getByRole('heading', { name: 'New chat' })).toBeVisible();
  85 |     await expect(page.getByText('Your team and one or more businesses')).toHaveCount(0);
  86 |     await expect(page.getByTestId('start-private-chat')).toHaveCount(0);
  87 |     await expect(page.getByTestId('start-team-chat')).toHaveCount(0);
  88 |   });
  89 | });
  90 | 
```