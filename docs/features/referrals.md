# Referrals

## Purpose

Trusted introductions: create a vouch / invite link so another company can land in-app and request access with **`referredBy`** pre-filled.

## Who uses it

Companies with the **`refer`** capability. Entry: **＋ → Refer** (when capability on) or `/referrals`.

## User flows

1. Open `/referrals` — list past referrals / links.
2. **New** (`/referrals/new`) — create invite / vouch → share token URL `/r/:token`.
3. Recipient opens landing → continues to access request with referral context.

## Business rules

| Rule | Detail |
|------|--------|
| Capability | Gated by `refer` on the company |
| Landing | Public-ish token route inside the authenticated app shell as routed |
| Access | `referredBy` attaches to the access request for the seller’s context |
| Not a bypass | Referral does not skip approve — seller still decides |

## Edge cases / empty states

- No `refer` capability → entry hidden from ＋.
- Invalid / unknown token → clear landing error.
- Empty referrals list for new capable sellers.

## Seed walkthrough

1. Seed Ravi has `canRefer: true` — open Referrals as Ravi → create a link.
2. Open `/r/:token` in another session → start access toward Surat Silk House with referral noted.

## Where it lives

- Web: `apps/web/src/features/referrals/`
- API: `apps/api/src/referral/`
- Contracts: `packages/domain-types/src/referral.ts`
