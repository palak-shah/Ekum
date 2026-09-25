# Settings & You

## Purpose

**You** (`/more`) is **identity + published presence** (**Edit** · **Share**) and the design library (**Designs · Collections**; **Published / Draft / Archived / Saved**). No follower / like counts. Shell title is **You** (same top band as Chats); **Network**, **Settings**, and **Log out** live in that band’s **⋯**. **Settings** is **configure Ekum** (domain cards — not Edit). Today: **Business & Roles** (Team, Your paths when trading, **Catalog defaults**, **Units** when selling/trading), **Dispatch**, **Billing**. Samples and returns live on the **Orders** tab only (filter by type).

## Who uses it

Every signed-in company owner/operator in Phase 1.

## User flows

### You (`/more`)

1. Avatar → You. Shell title is **You** (same top band as Chats / Orders — no second Back header). Business name is the primary line; person · city under it. **Edit · Share** sit as one quiet text line under the name (not a button pair). **Edit** = manage business/profile/content → `/settings/profile`. **Share** = share this shop (Ekum chats + OS share). **Buying / Selling / Can publish** are not shown on You — toggle them on **Edit** (Profile). Verified stays on the card when GST-verified.
2. Shell **⋯** (beside bell): Network, Settings, Log out. Do not put Edit or Share here.
3. Selling or trading: **Designs · Collections** segment + trailing **＋** square (same language as Chats / Orders). Status chips **Published / Draft / Archived / Saved** sit under that; **Find** + **Feed / Grid** pin on the chip row. Buyers: no library tabs (Saved still uses the same find). `/catalog` and `/saved` open You. Team and Your paths are under Settings.

### App update (installed / PWA)

When a **new web image** is on the server, a quiet top pill appears: **New version** · **Load** — in the **Safari tab and the Home Screen icon** (they do not share one frozen page). Tap reloads into the new build. The tab does **not** reload by itself (so a half-typed quote or order stays). There is no dismiss — skip is how the old app breaks. An API-only deploy, or uploading API/source without rebuilding `ekum-web`, does not show the pill. Local `vite dev` has no service worker, so the pill does not appear there. Each surface fetches uncached `/api/v1/web-build` (old workers already let `/api/` through; `/version.json` is a fallback) and `sw.js` while the page is **visible**, every **20 seconds**, plus on open / focus / back online. No pull-to-refresh. The page still does **not** reload until they tap **Load**. iOS will not poll while Ekum is fully backgrounded — the next time the screen is in front, the next poll shows the pill. Home Screen opens the shell from the **network first** so it is not stuck on a precached `index.html`. Needs HTTPS (or localhost). The pill sits below the iOS status bar (`z-100`).

**iPhone:** Safari and the Home Screen icon are **two apps** (separate worker + cache). Refreshing Safari never updates the icon. The icon has no pull-to-refresh; when it can see `/api/v1/web-build` it **drops its worker cache and reloads once** — not on `/login` or `/onboarding`, and not while a field is focused (that wiped the phone number). The one-shot key is `localStorage` so a reload does not loop. After they leave login, the next visible check applies. If it is stuck on an old worker (never sees that URL), delete the icon, then Settings → Safari → Advanced → Website Data → Ekum → Delete, then Safari → Share → Add to Home Screen. WhatsApp links still open Safari.

### Settings (`/settings`)

1. Domain groups (compact `SettingsDomainCard`, not KPI tiles): **Business & Roles** — **Team** → `/team`; **Your paths** → `/settings/paths` when Trading is on; when selling or trading — **Catalog defaults** → `/settings/catalog-defaults` (usual Who / Show rates / curate / download · design sell-as unit / pcs-in-set / MOQ — **not** rate or notes); **Units** → `/settings/units` (receive↔deliver conversions, e.g. 1 yard = n metres).
2. **Dispatch** and **Billing** stay on this page — **Add** (sheet). First billing firm is saved as Default.
3. New configuration joins an existing domain or adds one domain card. No empty Account / Privacy / Notifications blocks. Return policy / notification type mutes are not on this page yet.
4. **Edit** on You → `/settings/profile` (see [company](./company.md)).
5. Trade presence on Profile: buying / selling / trading only. Path (**Buyer talks to** · **Share a group**) is **Your paths**. New middle-hop pair always starts **You**, group **Off** (see [TradeLane](../superpowers/specs/2026-09-02-tradelane-design.md)).  
6. **Your paths** (`/settings/paths`): search + list. Why-line + **?** — **next orders only** (open tickets stay). Each card is mill · buyer, then a closed **Buyer talks to** pick (You / mill shop) and **Share a group** On/Off (tap saves). Needs **I trade on Ekum**. Empty until a first middle-hop pair exists.
7. **Catalog defaults** / **Units** store in `CompanySettings.tradeDefaults` (`publishDefaults`, `sellAsUsual`, `unitConversions`). New collection expandables prefill Who and sell-as (unit / pcs / MOQ). Rate and notes are set on the pack or design, not in Settings.

## Business rules

| Rule | Detail |
|------|--------|
| Trade presence | Turning selling off hides seller ＋ actions; creating catalog content can force selling back on |
| Capabilities | `publish` / `refer` still gate ＋ Broadcast and Refer even if selling is on |
| Contact person vs business | Profile edits business fields; auth user name is the person |
| Logout | Clears tokens; next open → login |

## Edge cases / empty states

- Selling off → no Add designs / Broadcast in ＋.
- Buying off → no Photo order on **Orders ＋** / **chat ＋**.
- Empty address book → prompt to add before checkout-like flows that need it.

## Seed walkthrough

1. As **Ravi**: You shows the designs library; Settings → Team / Your paths / addresses.
2. As **Meena**: You → **Edit**; confirm business name Jaipur Emporium. Orders → filter **Return** to see returns.
3. Toggle buying off briefly → ＋ loses buyer actions → restore.

## Where it lives

- Web: `apps/web/src/features/settings/` (`MorePage`, `SettingsPage`, `SettingsDomainCard`, `ProfilePage`, `YourPathsPage`, `CatalogDefaultsPage`, `UnitsSettingsPage`), catalog library on You, `apps/web/src/lib/tradePresence.ts`. **Your paths** at `/settings/paths`; **Catalog defaults** / **Units** when selling or trading. PWA update pill: `apps/web/src/lib/pwaUpdate.tsx` (prompt, not auto-reload).
- API: `GET/PATCH /trade-lanes`, company patch in identity
- Contracts: `packages/domain-types` TradeLaneView + update schema
