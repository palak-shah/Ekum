# Settings & You

## Purpose

**You** (`/more`) is the design library (**Collections · Designs**; published list; **Draft / Archived / Saved** in Find). No company identity card on this screen; no follower / like counts. Shell title is **My collections** (same top band as Chats) with **Back** → Home and the same account avatar (top right) as Home — no ⋯, no shop **Share**. Account (**Profile**, **Network**, **My Collections**, **Settings**, **Log out**) is that avatar **bottom sheet** (icon + text; MoreActionsSheet) — Designs is the You tab beside Collections. **Settings** is **configure Ekum** (domain cards — not Edit). Today: **Business & Roles** (Team, **Catalog defaults**, **Units** when selling/trading), **Dispatch**, **Billing**, **About Ekum**. **Direct links** live under **Network** (not Settings). `/settings/paths` and `/settings/your-paths` redirect there. Samples and returns live on the **Orders** tab only (filter by type).

## Who uses it

Every signed-in company owner/operator in Phase 1.

## User flows

### You (`/more`)

1. Home (or **My collections**) avatar opens **Profile · Network · My Collections · Settings · Log out**. **Profile** = `/settings/profile`. **My Collections** = You (Collections rest tab; switch to **Designs** there). Shell title is **My collections** with **Back** (left, same chevron as PageHeader) → **Home** (`/`) — not a second PageHeader. That band sits outside the scroll (same job as a chat thread header). Library chrome is two rows: **Collections · Catalogs · Designs**; then the same lot tools as an album (**Find · Select · Feed/Grid** via `BrowseLotChrome`). Create is a quiet list row per tab (**New collection** / **New catalog** / **New design**) — disabled while Selecting, not hidden. Find opens search + filter under that row. No shop identity card; collections Feed has no shop row. Shop **Share** lives on **Business profile** (header icon, same sheet as a shop) — not on You. **Buying / Selling / Can publish** are not shown on You or Edit. Creating a design still turns selling on.
2. You has no ⋯. Account is the shell avatar on Home and on **My collections** (bottom sheet; **Log out** last, danger). Do not put Share in that menu.
3. Selling or trading: **Collections · Designs** as parent underline tabs with **folder · dress** icons (same marks as shop + chat attach; Collections is the rest tab; `?tab=products` still opens Designs for deep links) (same treatment as Explore search kind tabs — not chips, not a beige well) + **Find** + **icon-only Feed / Grid** (`BrowseLayoutToggle`). Designs create is **New design** (same dashed-plus list row as **New collection** / **New catalog** — 48px thumb, not a filled tab ＋). Collections are a list (published and draft together). Selecting disables those create rows (they stay on screen). Bookmark / Deleted hide them. Page ⋯ (shell, top right) is **Drafts**, **Archived collections**, and **Bookmarks** when idle (`view=draft` lists draft/ready only); while collections are selected it is **Draft** (hide published) · **Publish** (drafts) · **Archive**. Those idle views keep Find open so **Showing Drafts** (etc.) + **Clear** is visible — they are not extra Find-menu rows on Collections. You list rows are the name (Draft chip, mill source, or Archived when needed) — not **N designs**. More or Share tints that row until the sheet closes. Select dock is **Share** · **Order**. My collections is off the main menu, so the bottom nav stays hidden. You Collections are a list, not a mosaic. The shop shelf still shares **`CollectionAlbumTile`**: mosaic → name → (You only) mill **From {shop}** when foreign members → **N designs** when live — no **shared with N**, no **Published**, no listing date. Shop shelf omits design count and date. Tags stay muted on Feed. Find on Collections hits mill names; mill designs stay off the Designs tab. Draft / Archived keep a quiet status word on the subtitle. **Draft / Archived / Bookmark** stay in the Find **filter menu**. Buyers: no library tabs (Bookmark still uses the same find). `/catalog` and `/saved` open You. Team is under Settings. **Direct links** are under Network. Own collection/design pages say **Your collection** / **Your design** on the shop row (not a chevron into your own shop). Pack-only designs on You say **In your collections**.

### App update (installed / PWA)

When a **new web image** is on the server, a quiet top pill appears: **New version** · **Load** — in the **Safari tab and the Home Screen icon** (they do not share one frozen page). Tap reloads into the new build. The tab does **not** reload by itself (so a half-typed quote or order stays). There is no dismiss — skip is how the old app breaks. An API-only deploy, or uploading API/source without rebuilding `ekum-web`, does not show the pill. Local `vite dev` has no service worker, so the pill does not appear there. Each surface fetches uncached `/api/v1/web-build` (old workers already let `/api/` through; `/version.json` is a fallback) and `sw.js` while the page is **visible**, every **20 seconds**, plus on open / focus / back online. A failed poll (offline / 5xx) does **not** hide a pill that is already showing — only a matching build id does. No pull-to-refresh. The page still does **not** reload until they tap **Load**. After Load, the pill hides until the **next** web image is uploaded. iOS will not poll while Ekum is fully backgrounded — the next time the screen is in front, the next poll shows the pill. Home Screen opens the shell from the **network first** so it is not stuck on a precached `index.html`. Needs HTTPS (or localhost). The pill sits below the iOS status bar (`z-100`).

**Android:** the system status bar follows `theme-color` (canvas from the active Light/Dark theme). iPhone Home Screen still uses the Apple status-bar style.

**iPhone:** Safari and the Home Screen icon are **two apps** (separate worker + cache **and** separate login). Refreshing Safari never updates the icon. The icon has no pull-to-refresh; when it can see `/api/v1/web-build` it **reloads once** — not on `/login` or `/onboarding`, not while a field is focused, and **without** unregistering the worker or deleting caches (that forgot the login). The one-shot key is `localStorage` so a reload does not loop. After they leave login, the next visible check applies. If it is stuck on an old worker (never sees that URL), delete the icon, then Settings → Safari → Advanced → Website Data → Ekum → Delete, then Safari → Share → Add to Home Screen. WhatsApp links still open Safari.

### Settings (`/settings`)

1. Domain groups (compact `SettingsDomainCard`, not KPI tiles): **Business & Roles** — **Team** → `/team`; when selling or trading — **Catalog defaults** → `/settings/catalog-defaults` (usual Who / Show rates / curate / download · **Rate per** (default **pc**) · **Order taken in** / **1 set contains** / **Dispatch unit** / MOQ — **not** rate amounts or notes; empty sell-as starts as order **set**, Dispatch **set**, Rate per **pc** until they save); **Units** → `/settings/units` (receive↔deliver conversions, e.g. 1 yard = n metres).
2. **Appearance** — Light · Dark · System (kit chips). Default **System** (follows the phone). Choice is stored on this device per signed-in person (`localStorage` `ekum.theme.{userId}`); applies immediately; no server sync. System listens to OS changes until they pick Light or Dark. Signed-out / private mode → System.
3. **Dispatch** and **Billing** stay on this page — **Add** (sheet). First billing firm is saved as Default. Selling or trading: kit chip **Show bill total on orders** under Billing (default off). Stored on `CompanySettings.tradeDefaults.showBillTotalOnOrders`. The hop’s **seller** company owns it; every party on that hop sees the same ticket (qty only, or Total ₹ on the right). Buyer cannot turn it on. Completeness: `2026-10-31-ticket-notes-timeline-path-icons-completeness`.
4. New configuration joins an existing domain or adds one domain card. No empty Account / Privacy / Notifications blocks. Return policy / notification type mutes are not on this page yet.
5. Home avatar **Profile** → `/settings/profile` **view** (see [company](./company.md)). Header **Share** (shop card to chats + OS). **Edit profile** unlocks fields; CTA **Update**; tab bar hidden while editing; Share hides in edit.
6. Path is **Direct links** under Network (`/network/direct-links`), not Profile and not Settings. Completeness: `2026-10-28-direct-links-network-completeness`. Trade presence flags still exist on the company; Edit does not show buy / sell / trade switches.  
7. **Direct links** (`/network/direct-links`): search + list **＋**. List is a compact table (Network grouped rows): **Supplier | Buyer | red delete icon**. Locked On rows (Direct supplier orders; supplier, buyer, and you share a group; **New supplier posts go to this buyer**) live on the **＋** sheet only — not on every row. No ticket/reveal rows. **＋** supplier = shops I follow; buyer = shops that follow me. Eligible link at Place → Direct mill ticket in **that** trio (same three shops, any name order; Save forms or reuses one group; later Place / trader mill Order for buyer join it). Mill own-catalog Order for buyer is not the trio. No link → I-handle + group off until Send. Completeness: `2026-10-28-direct-link-reuse-group-completeness`, `2026-10-29-one-trio-collapse-completeness`. Delete opens **Remove Direct link?** (existing orders stay). Removing a follow/follower/connection that would drop a link confirms first. Needs trading on the shop. `/settings/paths` and `/settings/your-paths` redirect here. Completeness: `2026-10-28-direct-links-delete-icon-completeness`.
8. **Catalog defaults** / **Units** store in `CompanySettings.tradeDefaults` (`publishDefaults`, `sellAsUsual`, `unitConversions`). New collection prefill Who and sell-as when the collection leaves those blank: **Rate per** (billing unit, default **pc**, same sheet picker as create collection), order unit / pcs-in-set / dispatch unit / MOQ. If they have never saved sell-as, order unit is **set**, Dispatch **set**, Rate per **pc**. Niche sellers (e.g. wedding lehengas) change defaults or that collection to order **pc** — then Place order stays per pc with no Sets chrome. Rate **amounts** and notes stay on the collection or design. MOQ is in the **order** unit. Official Item tags / Quality / work tags / Size options come from `GET /v1/catalog/taxonomy` (drill-down seed upserted on API boot + `db:seed`).
9. **About Ekum** (`/settings/about`) — read-only identity of the **running** App (PWA bake) and **API** (`GET /api/v1/version`): version, build id, commit, built time. Labels are never hardcoded in the UI; they come from Docker/Vite build metadata. When App and API were rebuilt separately, the two blocks can differ — that is intentional. **New version · Load** stays the update prompt; About does not reload the app.
10. **TEST badge** — when deployment is not `production` (`EKUM_DEPLOYMENT` / `VITE_EKUM_DEPLOYMENT`), a discreet kit Tag shows **TEST · {version} · {shortSha}** on **About Ekum** only. No chip on everyday screens. Mute; does not compete with **New version · Load**.

## Business rules

| Rule | Detail |
|------|--------|
| Trade presence | Turning selling off hides seller ＋ actions; creating catalog content can force selling back on |
| Capabilities | `publish` / `refer` still gate ＋ Broadcast and Refer even if selling is on |
| Contact person vs business | Profile edits business fields; auth user name is the person |
| Appearance | Light / Dark / System; default System; per `userId` on device; Ink & Lime tokens in `tokens.css`; Light/Dark/System chips match Chats kit Chip (gray idle, chip-on selected); no chat wallpaper picker |
| Show bill total on orders | Seller-company setting (database, not Appearance). Default off. Same ticket for every party on that hop. I-handle: buyer hop uses the trader’s flag; mill hop uses the mill’s. |
| Logout | Clears tokens; next open → login |
| Version identity | Semver from root `VERSION`; build id unique per image; baked at build — not runtime UI constants |
| Deployment flag | Explicit `production` \| `test` (not inferred from `NODE_ENV`) |

## Edge cases / empty states

- Selling off → ＋ does not open the Collection sheet (Orders if they buy). Add designs is on You, not nav ＋.
- Buying off → no Photo order on **Orders ＋** / **chat ＋**.
- Empty address book → prompt to add before checkout-like flows that need it.

## Seed walkthrough

1. As **Ravi**: You shows the designs library; Settings → Team / addresses; Network → Direct links.
2. As **Meena**: Home avatar → **Profile**; confirm business name Jaipur Emporium. Orders → filter **Return** to see returns.
3. Toggle buying off briefly → ＋ loses buyer actions → restore.

## Where it lives

- Web: `apps/web/src/features/settings/` (`MorePage`, `SettingsPage`, `SettingsDomainCard`, `ProfilePage`, `CatalogDefaultsPage`, `UnitsSettingsPage`, `AboutEkumPage`), Direct links `apps/web/src/features/network/DirectLinksPage.tsx`, theme `apps/web/src/theme/` + master tokens `apps/web/src/theme/tokens.css`, catalog library on You, Home avatar menu `apps/web/src/features/home/HomeAccountMenu.tsx`, `apps/web/src/lib/tradePresence.ts`, `apps/web/src/lib/appVersion.ts`. **Direct links** at `/network/direct-links` (legacy `/settings/paths`); **Catalog defaults** / **Units** when selling or trading; **About Ekum** at `/settings/about`. PWA update pill: `apps/web/src/lib/pwaUpdate.tsx` (prompt, not auto-reload).
- API: `GET/PATCH /trade-lanes`, company patch in identity; public `GET /api/v1/version`
- Contracts: `packages/domain-types` TradeLaneView + update schema
- Ops: root `VERSION`, `CHANGELOG.md`, `docs/docker.md`, production ship gate [`docs/superpowers/qa/RELEASE.md`](../superpowers/qa/RELEASE.md)
