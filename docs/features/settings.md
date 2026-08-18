# Settings & You

## Purpose

**You** (`/more`) is the personal hub: catalog, buyers, samples, returns, tools, profile, trade presence, and logout. Settings hold addresses, billing firms, and company preferences.

## Who uses it

Every signed-in company owner/operator in Phase 1.

## User flows

### You (`/more`)

1. Avatar → You.
2. Jump to My designs, Buyers, Samples, Returns, Broadcast/Referrals (when allowed), Settings, Profile.
3. Logout.

### Settings (`/settings`)

1. Toggle **buying** / **selling** presence (affects ＋ sheet and Home emphasis).
2. Manage **addresses** and **billing GST firms**.
3. Return policy / trade defaults / my-tools as exposed by the API.
4. Profile edit → `/settings/profile` (see [company](./company.md)).

## Business rules

| Rule | Detail |
|------|--------|
| Trade presence | Turning selling off hides seller ＋ actions; creating catalog content can force selling back on |
| Capabilities | `publish` / `refer` still gate Broadcast / Refer even if selling is on |
| Contact person vs business | Profile edits business fields; auth user name is the person |
| Logout | Clears tokens; next open → login |

## Edge cases / empty states

- Selling off → no Add designs / Broadcast in ＋.
- Buying off → no Photo order in ＋.
- Empty address book → prompt to add before checkout-like flows that need it.

## Seed walkthrough

1. As **Ravi**: You → My designs → Surat Silk House catalog; Settings → confirm selling on.
2. As **Meena**: You → Samples / Returns; confirm business name Jaipur Emporium on profile.
3. Toggle buying off briefly → ＋ loses buyer actions → restore.

## Where it lives

- Web: `apps/web/src/features/settings/` (`MorePage`, `SettingsPage`, `ProfilePage`), `apps/web/src/lib/tradePresence.ts`
- API: `apps/api/src/settings/`, company patch in identity
- Contracts: `packages/domain-types/src/settings.ts`, `company.ts`
