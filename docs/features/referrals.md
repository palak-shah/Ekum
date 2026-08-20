# Referrals

## Purpose

Shareable links for introductions and network growth:

- **Connect-with-me (open invite)** — no target. Partner requests access to **you**; you approve on **Buyers** (not auto-connect).
- **Targeted vouch** — optional target company. Recipient requests access with **`referredBy`** pre-filled; that seller still approves (not a trust bypass).

No auto-follow. Connection after approve unlocks **Connections**-audience collections.

## Who uses it

Any company. Entry: **＋ → Invite to connect** or **You → Invites** (`/referrals`).

## User flows

1. Open `/referrals` — list past links; **Share** (native sheet) or **Copy**.
2. **New** (`/referrals/new`) — create connect-with-me invite or vouch → Share / Copy `/r/:token`.
3. Recipient opens link (login / onboarding preserves return path when needed).
4. **Open invite** → **Request access** → `POST /referrals/:token/redeem` → pending request (`referredBy: Invite`) → you approve on Buyers.
5. **Targeted** → Request access to target → that seller approves as usual.

## Business rules

| Rule | Detail |
|------|--------|
| Open to all | Every company can mint connect / vouch links (`canRefer` defaults on) |
| Open invite | Redeem creates **access request** to referrer — not Connection; you approve |
| Targeted vouch | Referral does **not** skip approve — seller still decides |
| Self | Cannot redeem your own invite |
| Login funnel | `/r/:token` and `?invite=` survive OTP / onboarding via return stash |
| Follow | Not created by invite |
| Share preview | Share sends **one clickable link** (not a separate PNG). Messengers show the Ekum card from Open Graph when the host is public (`VITE_PUBLIC_ORIGIN`). Share text always names Ekum. |

## Edge cases / empty states

- No invites yet → empty list + create from ＋.
- Invalid / unknown token → clear landing error.
- Already connected / blocked → same errors as normal access request.

## Seed walkthrough

1. Open **＋ → Invite to connect** → create a **Connect with me** link → Share.
2. Open `/r/:token` as another company → Request access → as inviter, approve on **Buyers**.
3. (Optional) Create a vouch link with a target → request access still requires that seller’s approve.

## Where it lives

- Web: `apps/web/src/features/referrals/`, `apps/web/src/lib/shareInvite.ts` (link share only)
- OG preview: `apps/web/index.html` (`VITE_PUBLIC_ORIGIN` for absolute `og:image` on production)
- API: `apps/api/src/referral/` (`POST …/redeem` → access request)
- Contracts: `packages/domain-types/src/referral.ts`
- Login return: `apps/web/src/lib/inviteReturn.ts`
