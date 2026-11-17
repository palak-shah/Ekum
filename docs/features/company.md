# Company profile

## Purpose

**Business Profile** is the shop face for a company: identity, cover, Business Showcase, optional contact phones, and (when accessible) published collections/designs. It is a **business identity and discovery page**, not a collection-dependent page. Owners manage it from **Home (`/`)**.

## Who uses it

Anyone browsing a business (subject to Public/Private); owners edit on Home. Members manage people via **Settings → Team**.

## User flows

### Own Business Profile (Home `/`)

1. Bottom-nav **Home** opens your Business Profile (shell title **Home**; bottom nav stays). Account menu **Edit profile** and `/settings/profile?edit=1` open Edit Profile. `/settings/profile` without edit lands on `/`. Own `/company/:selfId` **redirects to `/`**.
2. Hero: **full-width cover** (optional) + **centred avatar** overlapping the cover bottom edge (`logoUrl`) + centred name · compact `Contact · City` (or city alone) · muted `Category · Category` line · quiet About (`line-clamp` + More when long). Identity type matches the app ladder (one product): name `text-name`, city/categories/private stub `text-meta text-muted`, About `text-sm text-muted` — same as Chats/Orders/Settings, not a profile-only scale. Missing cover while editing → quiet **Add cover** (not a loud empty slab). Contact name only when Connection rules already allow contact fetch — never login phone.
3. **Three independent photo controls** (edit / own only):
   - **Cover camera** on the cover → Add / Change / Remove **cover only**.
   - **Avatar camera** on the circle → profile photo only.
   - **Business Showcase** — no separate Home manage row. Owner opens from the cover overlay (**Add Showcase ›** when empty, **View Showcase ›** when photos exist). Add lives on the Showcase browse sheet; remove via × on each tile (no Manage / reorder). Up to **10** photos. Never a fifth primary pill. No inline thumbnail view strip on the profile face.
   - Sources: fresh upload or pick an **own** design photo. Remove **unlinks** from the profile; does not delete media blobs or designs.
4. Viewing photos: cover overlay opens a **Showcase sheet** (grid default / feed toggle). Tap a photo → PhotoViewer with **Showcase URLs only**. Visitors see the overlay only when Showcase has ≥1 photo; owners always (to Add when empty). Overlay sits on the photo cover or quiet empty shell. Tap cover photo elsewhere → cover-first gallery. Cover camera must not open either gallery. Missing cover + Showcase (or owner Add) still shows the empty foam shell.
5. Equal-width white pills (icon above label, quiet border): **Edit · Share · Network · Saved**, then optional completeness nudge, then Catalogue. Icons charcoal accent — no foam wash on the action row (reads heavy). **Network** → `/network` hub (Following · Followers · Connections · …) — not three categories on the profile face. Share → Universal Share → rich **`company_card`** in chats (plus optional native URL). Destinations unchanged. See [access-and-connections](./access-and-connections.md).
6. **Home only — completeness nudge:** kit **Chip** (chip-on / lime attention) after action pills when optional face fields are missing (profile photo, cover, about, sell categories — max 3). No foam banner box, no eyebrow/why copy. Chips open Home cameras or `/settings/profile?edit=1` (sell: `?focus=sell`). Soft × dismisses until the incomplete set changes (localStorage fingerprint). Never on visitor/stub.
7. **Public / Private** (Instagram-like) is switched under **Settings → Privacy** (not the main Home profile or Edit Profile hero). Default **Public** for existing and new companies. Flipping visibility does not change collection audience, Network, chat, or phone opt-ins.
8. **Phones (edit):** company-level contact number + opt-in; each team member’s display phone + own opt-in (Team/profile). Independent flags.
9. **Catalogue:** White body (no invent bordered card frame) with Collections/Designs underline tabs — **Orders language** via shared `underlineTabChrome` (`text-accent` + `h-1 bg-accent`; **not** lime `border-badge`). Same chrome as You; **no Catalogs** tab — catalog packs sit in Collections. No extra Catalogue heading. Show **only** when there is accessible **published** content. Zero packs/designs → omit section. Empty catalogue does **not** mean an incomplete profile. No tab intent on land: **first tab with rows** (Collections → Designs); both empty → **Collections**. A tap on a tab is kept (seed does not override). **Home** and **visitor shop** show **4** collection rows or **4** design tiles (2×2); preview body keeps a shared min-height so **View more…** / **View all…** stay at the same spot when switching tabs. List/grid body stays surface (no field wash). Home: quiet **View more…** → My collections (`/more?tab=collections` or `/more?tab=products`); Home keeps the same kind in `/?tab=` so You **Back** lands on Designs when you left from Designs. Visitor shop: quiet **View all…** → `/company/:id/catalogue` (`?tab=collections` or `?tab=products`). Preview faces have no Select / Find / layout; taps still open album / DesignSheet. **Visitor catalogue page** (`/company/:id/catalogue`): full audience-allowed list + Find + layout + Select + trade dock + collection ⋯ (Message · Share · Bookmark) — same actions as the former full shop shelf. Own `/company/:id/catalogue` redirects to `/more`. Collection rows match You list (`YouCollectionListRow`) without library meta / draft chips. Designs match You Designs tiles (feed/grid on catalogue; grid on Home/shop preview). Tap collection → album (`packManage` when own). Tap design → DesignSheet. Own collection ⋯ is existing owner manage/share (`OwnerCollectionMoreSheet`, no Draft/Hide/Delete; Who/Add/Edit open the album).
10. **Business info** (below catalogue, or alone when catalogue omitted): foam card with an ink **Business info** header (not muted) and accent icons on rows, then `InfoRow`s. Contacts and Team are sibling foam cards (same light border; ink titles + accent header icons). Optional **hours** (`Open now · 10:30 AM – 7:30 PM · Sunday off` / `Closed now · Opens at …`; tap → weekday sheet), **shop address** + quiet **Map** (Google Maps search of the saved text; no GPS), **website** (domain, opens https). Then city, categories, sells/buys when known, GST line (own GSTIN or “GST not shared”; visitors see verified / not shared without GSTIN). Contacts when Connected or own (opted-in phones); each number has a trailing green Call icon (`tel:` / success). **Home Team card** lists members (name · Owner/Staff); tap → **Invite** (if allowed) / **Edit team** (`/team`, invite via `?invite=1`). Visitor shops have no Team roster. “On Ekum since …”. Hide hours / address / website when unset. Edit only on `/settings/profile?edit=1`. Hours are one open/close + weekly off (IST, same-day close after open). City stays `Company.city` — street fields do not replace it. Stub omits hours/address/website.



### Other company (`/company/:id`)

1. Open from Explore, Find, chat, Network, etc. A 1:1 title may pass `{ fromChat: true }`. Bottom nav hidden on other shops.
2. **Block** → **404** (silent).
3. **Public** (or **Private** + **approved Follower**): full profile — cover (or empty shell when Showcase exists without cover) with optional **View Showcase ›**, about, categories, conditional catalogue. Primary actions: **Follow / Requested / Following · Message / Chat · Share** (equal white pills; **Follow** = action, **Following** = allowed state — filled charcoal). **Chat** when a Direct already exists → open it; **Message** with no Direct yet → compose first text, then create the thread (no empty chat). Not Connect; not pack **Request to access.** Completeness: `2026-11-17-chat-on-first-message-completeness`. ⋯ keeps Share · Mute · Block · **Unfollow** last (`DELETE /follows`; Connection may remain). **Phones** only when **Connected** and opted in (company number first, then team) — not on the identity line. Login OTP phone never shown. No visitor Showcase manage.
4. **Private** + not approved follower: **stub** — centred avatar/initials + **This business is private.** No cover, Showcase overlay, about, catalogue, or phones. Actions: **Follow · Message · Share** (same three; no identity leak).
5. Full-profile hero matches Home composition (centred cover/avatar). Shop face catalogue is a short preview + **View all…**; Selecting / Find / layout / dock live on `/company/:id/catalogue`. **Omit** catalogue when nothing is accessible to this viewer.
6. Collection / design visibility still uses existing audience rules — independent of profile Public/Private and of showcase.

### Team (`/team`)

Unchanged: Settings → Team invites, caps, archive. Phone **visibility** opt-ins for the Business Profile may be edited on Team rows and/or profile edit; invite flow unchanged.

## Business rules

| Rule | Detail |
|------|--------|
| Profile vs collections | Cover + Showcase follow **profile access**. Packs/designs follow **audience** / Follow / grants. Showcase is not pack media. |
| Profile access | **Public:** any authenticated non-blocked company. **Private:** owner or approved Follower (`Follow.status = allowed`) for full profile; else stub. |
| Showcase | ≤10 additional URLs; cover separate; gallery = cover then showcase; independent of having any collection. Cover / avatar / Showcase PATCH stores URL strings with no Media/Product ownership gate (upload is the trader’s responsibility). |
| Contact phones | Shown only to **Connections** when opted in. Company `contactPhone` first, then team `displayPhone` with `showPhone`. Login phone never emitted. Each number shows a trailing green **Call** icon (`tel:` / `text-success`) that opens the device dialer |
| Silent block | Blocked viewers get **404** |
| Capabilities / verification | Unchanged |
| Own vs other | Editing only for the acting company |
| Team | Unchanged membership rules |
| Explore / Find | Private companies excluded from public discovery; still listed for approved followers |

## Edge cases / empty states

- Zero collections/designs → complete profile without catalogue section.
- Missing hours/address/website → those rows hidden; city still shows.
- Missing logo → initials; missing cover → Add cover when editing; missing cover + Showcase → empty shell + View Showcase for visitors (and owner).
- Unfollow a Private shop → back to stub; owner showcase unchanged.
- Design used in showcase unpublished → URL copy remains until owner removes (unlink).

## Seed walkthrough

1. As **Meena**: open Surat Silk House — full public profile / showcase when allowed.
2. As **Ravi**: Home → Surat Silk House own profile; Edit cover with cover camera; Showcase via cover overlay → browse sheet Add / × remove.
3. Private stub: non-follower sees **This business is private.**

## Where it lives

- Web: Home `/` own profile; `apps/web/src/features/company/CompanyProfilePage.tsx` for others
- API: `apps/api/src/identity/company.service.ts`, contact serializer, Explore/search filters
- Contracts: `packages/domain-types/src/company.ts`
- Completeness: `docs/superpowers/reviews/completeness/2026-11-15-business-profile-home-showcase-completeness.md`, `docs/superpowers/reviews/completeness/2026-11-15-business-profile-visual-alignment-completeness.md`, `docs/superpowers/reviews/completeness/2026-11-15-drop-profile-media-ownership-completeness.md`
