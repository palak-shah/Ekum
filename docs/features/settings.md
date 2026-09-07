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
5. Trade presence on Profile: buying / selling / trading, plus **When buyers order from what I share** (**Direct** / **I handle**). After TradeLane ships, this is only a **fallback** when no pair lane exists — a **new** pair still starts **I handle**, they do **not** see each other (see [TradeLane](../superpowers/specs/2026-09-02-tradelane-design.md)). Until then, shipped Profile default may still be Direct; do not treat that as the first-order product default.
6. **Your paths** (`/settings/paths`, You): search + list of supplier × buyer — order with (Me / shop) and see each other (Off / On). Same two switches as More / order page. Needs **I trade on Ekum**. Empty until a first middle-hop pair exists.

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

- Web: `apps/web/src/features/settings/` (`MorePage`, `SettingsPage`, `ProfilePage`), `apps/web/src/lib/tradePresence.ts`. **Your paths** (`/settings/paths`) is specified, not built.
- API: `apps/api/src/settings/`, company patch in identity
- Contracts: `packages/domain-types/src/settings.ts`, `company.ts`
