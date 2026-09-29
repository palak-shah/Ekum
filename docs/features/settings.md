# Settings & You

## Purpose

**You** (`/more`) is **identity + published presence** (card **Edit profile**; header **Share** icon) and the design library (**Designs · Collections**; **Published / Draft / Archived / Saved**). No follower / like counts. Shell title is **You** (same top band as Chats); **Share** icon then **⋯** (**Network**, **Settings**, **Log out**). **Settings** is **configure Ekum** (domain cards — not Edit). Today: **Business & Roles** (Team, Your paths when trading, **Catalog defaults**, **Units** when selling/trading), **Dispatch**, **Billing**. Samples and returns live on the **Orders** tab only (filter by type).

## Who uses it

Every signed-in company owner/operator in Phase 1.

## User flows

### You (`/more`)

1. Avatar → You. Shell title is **You** (same top band as Chats / Orders — no second Back header). Business name is the primary line; person · city under it. **Edit profile** is the one outline pill under the name. **Share** is a header icon (same as a shop — not a second pill). **Edit profile** = `/settings/profile`. **Share** = share this shop (Ekum chats + OS share). **Buying / Selling / Can publish** are not shown on You or Edit. Creating a design still turns selling on. Verified stays on the card when GST-verified.
2. Shell **Share** then **⋯**: Network, Settings, **Log out**. Menu is a wide panel (not a squeezed chip); each row is full width; **Log out** is danger-coloured. Do not put Edit or Share in ⋯.
3. Selling or trading: **Designs · Collections** as parent underline tabs (same treatment as Explore search kind tabs — not chips, not a beige well) + trailing filled teal **＋** (40×40, same depth as Chats header ＋). Status chips **Published / Draft / Archived / Saved** sit under that selected tab; **Find** + **Feed / Grid** pin on the chip row. Buyers: no library tabs (Saved still uses the same find). `/catalog` and `/saved` open You. Team and Your paths are under Settings. Own pack/design pages say **Your collection** / **Your design** on the shop row (not a chevron into your own shop). Pack-only designs on You say **In your packs**.

### App update (installed / PWA)

When a **new web image** is on the server, a quiet top pill appears: **New version** · **Load** — in the **Safari tab and the Home Screen icon** (they do not share one frozen page). Tap reloads into the new build. The tab does **not** reload by itself (so a half-typed quote or order stays). There is no dismiss — skip is how the old app breaks. An API-only deploy, or uploading API/source without rebuilding `ekum-web`, does not show the pill. Local `vite dev` has no service worker, so the pill does not appear there. Each surface fetches uncached `/api/v1/web-build` (old workers already let `/api/` through; `/version.json` is a fallback) and `sw.js` while the page is **visible**, every **20 seconds**, plus on open / focus / back online. A failed poll (offline / 5xx) does **not** hide a pill that is already showing — only a matching build id does. No pull-to-refresh. The page still does **not** reload until they tap **Load**. After Load, the pill hides until the **next** web image is uploaded. iOS will not poll while Ekum is fully backgrounded — the next time the screen is in front, the next poll shows the pill. Home Screen opens the shell from the **network first** so it is not stuck on a precached `index.html`. Needs HTTPS (or localhost). The pill sits below the iOS status bar (`z-100`).

**iPhone:** Safari and the Home Screen icon are **two apps** (separate worker + cache **and** separate login). Refreshing Safari never updates the icon. The icon has no pull-to-refresh; when it can see `/api/v1/web-build` it **reloads once** — not on `/login` or `/onboarding`, not while a field is focused, and **without** unregistering the worker or deleting caches (that forgot the login). The one-shot key is `localStorage` so a reload does not loop. After they leave login, the next visible check applies. If it is stuck on an old worker (never sees that URL), delete the icon, then Settings → Safari → Advanced → Website Data → Ekum → Delete, then Safari → Share → Add to Home Screen. WhatsApp links still open Safari.

### Settings (`/settings`)

1. Domain groups (compact `SettingsDomainCard`, not KPI tiles): **Business & Roles** — **Team** → `/team`; **Your paths** → `/settings/paths` when Trading is on; when selling or trading — **Catalog defaults** → `/settings/catalog-defaults` (usual Who / Show rates / curate / download · design sell-as unit / pcs-in-set / MOQ — **not** rate or notes); **Units** → `/settings/units` (receive↔deliver conversions, e.g. 1 yard = n metres).
2. **Dispatch** and **Billing** stay on this page — **Add** (sheet). First billing firm is saved as Default.
3. New configuration joins an existing domain or adds one domain card. No empty Account / Privacy / Notifications blocks. Return policy / notification type mutes are not on this page yet.
4. **Edit profile** on You → `/settings/profile` (see [company](./company.md)).
5. Path (**Buyer talks to** · **Share a group**) is **Your paths**, not Profile. New middle-hop pair always starts **You**, group **Off** (see [TradeLane](../superpowers/specs/2026-09-02-tradelane-design.md)). Trade presence flags still exist on the company; Edit does not show buy / sell / trade switches.  
6. **Your paths** (`/settings/paths`): search + list. Why-line + **?** — **next orders only** (open tickets stay). Each card is mill · buyer, then a closed **Buyer talks to** pick (You / mill shop) and **Share a group** On/Off (tap saves). Needs trading on the shop (not a Profile switch). Empty until a first middle-hop pair exists.
7. **Catalog defaults** / **Units** store in `CompanySettings.tradeDefaults` (`publishDefaults`, `sellAsUsual`, `unitConversions`). New collection expandables prefill Who and sell-as (unit / pcs / MOQ). Rate and notes are set on the pack or design, not in Settings.

## Business rules

| Rule | Detail |
|------|--------|
| Trade presence | Turning selling off hides seller ＋ actions; creating catalog content can force selling back on |
| Capabilities | `publish` / `refer` still gate ＋ Broadcast and Refer even if selling is on |
| Contact person vs business | Profile edits business fields; auth user name is the person |
| Logout | Clears tokens; next open → login |

## Edge cases / empty states

- Selling off → ＋ does not open New collection (Orders if they buy). Add designs is on You, not nav ＋.
- Buying off → no Photo order on **Orders ＋** / **chat ＋**.
- Empty address book → prompt to add before checkout-like flows that need it.

## Seed walkthrough

1. As **Ravi**: You shows the designs library; Settings → Team / Your paths / addresses.
2. As **Meena**: You → **Edit profile**; confirm business name Jaipur Emporium. Orders → filter **Return** to see returns.
3. Toggle buying off briefly → ＋ loses buyer actions → restore.

## Where it lives

- Web: `apps/web/src/features/settings/` (`MorePage`, `SettingsPage`, `SettingsDomainCard`, `ProfilePage`, `YourPathsPage`, `CatalogDefaultsPage`, `UnitsSettingsPage`), catalog library on You, `apps/web/src/lib/tradePresence.ts`. **Your paths** at `/settings/paths`; **Catalog defaults** / **Units** when selling or trading. PWA update pill: `apps/web/src/lib/pwaUpdate.tsx` (prompt, not auto-reload).
- API: `GET/PATCH /trade-lanes`, company patch in identity
- Contracts: `packages/domain-types` TradeLaneView + update schema
