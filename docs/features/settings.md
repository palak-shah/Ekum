# Settings & You

## Purpose

**You** (`/more`) is the personal hub: catalog, saved items, network, tools, profile, trade presence, and logout. Settings hold addresses, billing firms, and company preferences. Samples and returns live on the **Orders** tab only (filter by type).

## Who uses it

Every signed-in company owner/operator in Phase 1.

## User flows

### You (`/more`)

1. Avatar → You.
2. Jump to **My designs & collections** (sellers first; why-line *Drafts, packs, publish*), **Saved**, Network, Team, Settings, Profile.
3. Logout.

### Settings (`/settings`)

1. **Home attention** — optional age-out for Home Needs (Off / 7 / 14 / 30 days; default Off). Device-local.
2. Manage **addresses** and **billing GST firms**.
3. Return policy / trade defaults / my-tools as exposed by the API.
4. Profile edit → `/settings/profile` (see [company](./company.md)).
5. Trade presence on Profile: buying / selling / trading only. Path (Me / mill · see each other) is **Your paths** — not on Profile. New middle-hop pair always starts **I handle**, they do **not** see each other (see [TradeLane](../superpowers/specs/2026-09-02-tradelane-design.md)).  
6. **Your paths** (`/settings/paths`, You): search + list. One why-line at top; each card is mill · buyer, then Me/{mill} and See each other On/Off (tap saves; next orders only). Needs **I trade on Ekum**. Empty until a first middle-hop pair exists.

## Business rules

| Rule | Detail |
|------|--------|
| Trade presence | Turning selling off hides seller ＋ actions; creating catalog content can force selling back on |
| Capabilities | `publish` / `refer` still gate ＋ Broadcast and Refer even if selling is on |
| Contact person vs business | Profile edits business fields; auth user name is the person |
| Logout | Clears tokens; next open → login |

## Edge cases / empty states

- Selling off → no Add designs / Broadcast in ＋.
- Buying off → no Photo order in ＋.
- Empty address book → prompt to add before checkout-like flows that need it.

## Seed walkthrough

1. As **Ravi**: You → My designs → Surat Silk House catalog; Settings → confirm selling on.
2. As **Meena**: You → Business profile; confirm business name Jaipur Emporium. Orders → filter **Return** to see returns.
3. Toggle buying off briefly → ＋ loses buyer actions → restore.

## Where it lives

- Web: `apps/web/src/features/settings/` (`MorePage`, `SettingsPage`, `ProfilePage`, `YourPathsPage`), `apps/web/src/lib/tradePresence.ts`. **Your paths** at `/settings/paths` (You → Your paths when Trading is on).
- API: `GET/PATCH /trade-lanes`, company patch in identity
- Contracts: `packages/domain-types` TradeLaneView + update schema
