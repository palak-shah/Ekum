# Company profile

## Purpose

Public shop card for a business (logo, city, about, verification, categories, published work) and the owner’s edit surface for their own company.

## Who uses it

Anyone browsing a business; owners **look** via Home avatar **Profile**, then **Edit profile** on that page (or own-shop **Edit profile**, which opens already editing). Members manage people via **Settings → Team**.

## User flows

### Public profile (`/company/:id`)

1. Open from Explore, search, chat, or Home. A 1:1 title passes `{ fromChat: true }`.
2. Header is Back · **business name** + GST tick · Find · Share (name once, stays when you scroll). Hero: logo, then **contact name + role** (when Connected) · `city · categories` · about · type chips. No green **GST verified** chip. Contact is not under the action row. No phone.
3. Header: **Find** + **Share** as icons. One compact action row (Instagram / WhatsApp density, foam fill): **See new packs** · **Message**. After they ask: **Asked to see packs** (outline; tap to cancel). After allow: **Seeing packs** (teal). **Message** when not connected and no live 1:1; **Chat** when Connected or you already have an active 1:1. Message stays even from a 1:1. No **Request**. Why-line: **See new packs = they let you see new posts. Tap again to cancel the ask. Message = first chat. Chat = you already talk.** Sell-only shops still show See new packs. Own shop: **Edit profile** on the row; Share stays in the header. Connected: contact **name + role** in the hero above city / types — **no phone**, not under the action row. **Curate** on the shop dock needs Trading **and** a put-in-pack grant (or an active Connection with `allowForward`).
4. **Share** opens a sheet: pick connections and **Find on Ekum**, then post a text chat with the shop name + `/company/:id`. Quiet **Share outside** uses the OS share sheet (WhatsApp etc.); copy is last resort. Outsiders hit login, then the shop.
5. Shop: **Collections · Designs** on the catalog row (Collections first, same as You; **labels only** — no catalog-size counts on the pills), with quiet **Feed / Grid** on that same row when the active tab has items (same last-wins choice as Saved, album, My designs; **Ekum default Feed**) — not in the page header. **Find** is a header icon (not a permanent field). Tap opens the field **in the header under that icon** (Find designs / Find collections); close clears. Filters **this tab** in place (design name; packs: name, tags, member name / SKU / notes / tags). Keep the grid until they type — not Explore search. **Feed** uses the same mosaic + caption as Explore, but **no shop row** on this shop’s catalog (name · city · cats already live on the profile). Mosaic → pack name → **date** (no design count), then tags when the pack has them. **Grid** is **2-col** (mosaic + name; no design count; no shop row). Mosaic uses preview thumbs only (no `+N` from hidden inventory). **Designs** = this seller’s published designs, **once each** — solo Explore posts **and** members of live packs the viewer can see. The same design in many collections is one cell (not N copies). Pack-only designs (no Explore tile) still show here. Design cell = first photo + **name**. No photo → initial on linen. Collection cell = Explore mosaic (`AlbumGrid` of each design’s first photo) + **name** only. No pack cover. Tap the photo / mosaic → open, or **toggle select** when Selecting. The **name** always opens the design page or album (even while Selecting). Find is the first page of shop cards until we paginate.
6. **Select** / long-press on **Designs** and **Collections** adds to the traveling pile (designs → shortlist, collections → album pick). While **Selecting**, **N selected · Select all · Clear** is a pill under **Select** (right-aligned with that control) — not a full-width bar under the header. When **this shop** has at least one selected design **or** collection (picked here or on Explore — same `companyId`), hide the tab bar and the floater on this page, and show a dock: **Curate** (Trading on) · **Ask for rates** · **Order**. The dock acts on **this page’s** picks. Each design keeps its own shop; Ask / Order use batch so mixed mills split by **Your paths** (same as Your selection). Other shops left in the pile stay there. Collections on the dock resolve first (**All designs** / **Choose**, same as Your selection). **Continue** loads those designs into **How many each** (toast if a pack cannot expand). Other shops stay in the pile. **Clear** unselects every design and collection **on this shop** (this grid, plus any other pick stored as this seller). Select all is the active tab. Own shop: no trade dock. Mixed-seller Order / Bookmark / Share stay on **Your selection**.

### Own profile (`/settings/profile`)

1. Home avatar **Profile** → `/settings/profile` **view**: values as text, **Edit profile** last. Fields are not inputs. Bottom nav stays.
2. **Edit profile** (or own shop **Edit profile** → `?edit=1`, or Explore Buyers empty → `?focus=sell`) unlocks fields and logo. **Update** is a sticky bottom dock (same as collection edit; tab bar hidden). Back leaves edit (no Cancel). **Edit profile** stays last on the view scroll.
3. **Update** → PATCH `/companies/me`, toast, back to view. Public shop and session card follow.

### Team (`/team`)

1. **Settings → Team** — every member sees the list (name + Owner / Staff).
2. With **Team** cap: **Invite** (name + 10-digit) → share `/t/:token`. Edit caps on a row. Remove staff.
3. Recipient OTP on that phone → Join. Becomes staff if they have **no live** business. After **Remove** (archive) at a prior shop, the same phone may join another shop or create a company. Still live elsewhere → blocked until that shop removes them. Last owner cannot be removed.
4. **Remove** archives the person (they cannot open chats). Work and their name on your side stay. Internal: “Priya left the team.” Dedup of group chats still counts them. Not a hard delete. Re-invite to **this** shop unarchives the same seat.

## Business rules

| Rule | Detail |
|------|--------|
| Contact protection | Shop **never** shows phone (even when connected / `showPhone`). `GET /companies/:id/contact` may still return a display phone for other surfaces; login phone is never emitted |
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
