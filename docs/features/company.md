# Company profile

## Purpose

Public shop card for a business (logo, city, about, verification, categories, published work) and the owner’s edit surface for their own company.

## Who uses it

Anyone browsing a business; owners edit via **You → Edit** or own-shop **Edit**. Members manage people via **Settings → Team**.

## User flows

### Public profile (`/company/:id`)

1. Open from Explore, search, chat, or Home. A 1:1 title passes `{ fromChat: true }`.
2. One hero: logo, city, GST if verified, one-line about, categories. Header keeps the business name (no second title block).
3. One action row (no wrap, one line each): **Follow** · **Message** · **Share** · **Request** (Follow / **Pending** / Following · Message / **Chat** when a request thread exists · Share · Request / **Asked** after they sent access). Quiet why-line: **Follow = ask to see their new designs. Request access = rates and orders.** Sell-only shops still show Follow. From a 1:1, hide Message / Chat. Own shop: **Edit** · **Share** (no Follow / Request / why-line). Connected: quiet contact name (phone only if opted in). **Curate** on the shop dock needs Trading **and** a put-in-pack grant (or an active Connection with `allowForward`).
4. **Share** opens a sheet: pick connections and **Find on Ekum**, then post a text chat with the shop name + `/company/:id`. Quiet **Share outside** uses the OS share sheet (WhatsApp etc.); copy is last resort. Outsiders hit login, then the shop.
5. Shop: **Designs · Collections**. Quiet **Feed / Grid** in the header when the active tab has items (same last-wins choice as Saved, album, My designs; **Ekum default Feed**). **Find** is a header icon (not a permanent field). Tap to **Find designs / Find collections**; close clears. Filters **this tab** in place (design name; packs: name, tags, member name / SKU / notes / tags). Keep the grid until they type — not Explore search. Grid is **2-col**. **Designs** = this seller’s published designs, **once each** — solo Explore posts **and** members of live packs the viewer can see. The same design in many collections is one cell (not N copies). Pack-only designs (no Explore tile) still show here. Design cell = first photo + **name**. No photo → initial on linen. Collection cell = Explore mosaic (`AlbumGrid` of each design’s first photo) + **name** + design count. No pack cover. Tap the photo / mosaic → open, or **toggle select** when Selecting. The **name** always opens the design page or album (even while Selecting). Find is the first page of shop cards until we paginate.
6. **Select** / long-press on **Designs** and **Collections** adds to the traveling pile (designs → shortlist, collections → album pick). When **this shop** has at least one selected design **or** collection (picked here or on Explore — same `companyId`), hide the tab bar and the floater on this page, and show a dock: **Curate** (Trading on) · **Ask for rates** · **Order**. The dock acts on **this seller’s** lines only. Collections on the dock resolve first (**All designs** / **Choose**, same as Your selection). Other shops stay in the pile. **Clear** unselects every design and collection **on this shop** (this grid, plus any other pick stored as this seller). Select all is the active tab. Own shop: no trade dock. Mixed-seller Order / Bookmark / Share stay on **Your selection**.

### Own profile (`/settings/profile`)

1. From You **Edit** or own shop **Edit** → `/settings/profile`: name, city, about, logo, GST, categories, super-categories.
2. Save → reflected on public profile and session company card.

### Team (`/team`)

1. **Settings → Team** — every member sees the list (name + Owner / Staff).
2. With **Team** cap: **Invite** (name + 10-digit) → share `/t/:token`. Edit caps on a row. Remove staff.
3. Recipient OTP on that phone → Join. Becomes staff if they have **no live** business. After **Remove** (archive) at a prior shop, the same phone may join another shop or create a company. Still live elsewhere → blocked until that shop removes them. Last owner cannot be removed.
4. **Remove** archives the person (they cannot open chats). Work and their name on your side stay. Internal: “Priya left the team.” Dedup of group chats still counts them. Not a hard delete. Re-invite to **this** shop unarchives the same seat.

## Business rules

| Rule | Detail |
|------|--------|
| Contact protection | Public profile **never** exposes phone. When connected, `GET /companies/:id/contact` returns named contact points; phone only if `showPhone` opted in (never login phone) |
| Silent block | Blocked viewers get **404**, not “you are blocked” |
| Capabilities | Shown as data (`publish`, `relist`, `refer`) on own company |
| Verification | `not_verified` · `gst_verified` |
| Own vs other | Editing only for the acting company’s profile |
| Team | People under this company (`owner` / `staff` + five caps). Invite is phone-bound; a phone with a **live** business elsewhere cannot join. After archive, same phone may join another shop. No company switcher (one live at a time). |
| Leave Team | **Archive**, do not delete. Archived people cannot sign in as this company. Group-chat uniqueness still includes them. Rejoin this shop = unarchive via invite. |

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
- Completeness shop chrome: `docs/superpowers/reviews/completeness/2026-09-23-company-profile-shop-chrome-completeness.md`
- Completeness shop dock + Share: `docs/superpowers/reviews/completeness/2026-09-23-company-shop-trade-share-completeness.md`
