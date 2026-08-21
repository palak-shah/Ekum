# Company profile

## Purpose

Public shop card for a business (logo, city, about, verification, categories, published work) and the owner’s edit surface for their own company.

## Who uses it

Anyone browsing a business; owners edit via **You → profile / settings**.

## User flows

### Public profile (`/company/:id`)

1. Open from Explore, search, chat, or Home.
2. View about, city, GST verification badge, buy/sell categories.
3. Browse published collections and designs (2-col grid). Designs: **Select** / long-press → Order / Curate on the sticky bar. Sticky **Select all** / **Clear** for shop designs; **Selecting** with picks → clears shortlist; with none → exits. Collections open the album to pick designs.
4. When **Connected**: see contact name (and phone only if they opted in) via `/companies/:id/contact`; Message / order as available.
5. Actions: Follow, Request access, Chat (as available).

### Own profile (`/settings/profile`)

1. From You / Settings → edit name, city, about, logo, GST, categories, super-categories.
2. Save → reflected on public profile and session company card.

## Business rules

| Rule | Detail |
|------|--------|
| Contact protection | Public profile **never** exposes phone. When connected, `GET /companies/:id/contact` returns named contact points; phone only if `showPhone` opted in (never login phone) |
| Silent block | Blocked viewers get **404**, not “you are blocked” |
| Capabilities | Shown as data (`publish`, `relist`, `refer`) on own company |
| Verification | `not_verified` · `gst_verified` |
| Own vs other | Editing only for the acting company’s profile |

## Edge cases / empty states

- No published catalog → empty collections/designs sections.
- Missing logo → avatar initials from business name.

## Seed walkthrough

1. As **Meena**: open Surat Silk House profile — GST verified, sell categories, Wedding Edit.
2. As **Ravi**: open own profile via You → confirm business name is **Surat Silk House** (not “Ravi”).
3. As **Meena**: confirm own business shows **Jaipur Emporium**.

## Where it lives

- Web: `apps/web/src/features/company/CompanyProfilePage.tsx`, `apps/web/src/features/settings/ProfilePage.tsx`
- API: `apps/api/src/identity/company.service.ts`, serializer / contact in `apps/api/src/access/`
- Contracts: `packages/domain-types/src/company.ts`
