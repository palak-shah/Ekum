# Home

## Purpose

Home (`/`) is the company’s **own Business Profile** — identity, cover, Business Showcase, and (when present) accessible catalogue. It is **not** an attention inbox.

## Who uses it

Every signed-in company. Bottom-nav **Home** opens your shop face.

## User flows

1. Open Home → shell title **Home**; own Business Profile (cover, avatar, name, about, categories, Public/Private, optional phones when editing, Showcase, conditional Collections/Designs preview). Account avatar → **Edit profile** (`/settings/profile?edit=1`).
2. **Edit** / in-place edit: three separate photo controls — **cover camera** on the cover, **avatar camera** on the circle, **Showcase** photo manager in the Business Showcase section. Sources: fresh upload or pick own design photo. Remove unlinks from the profile only (does not delete media or designs).
3. Tap cover (view) → view-only **PhotoViewer** gallery: cover is image 1, then up to 10 showcase photos. No product / collection / order navigation from the gallery.
4. White pills: **Edit · Share · Network · Saved** (quiet border; charcoal icons; no foam wash). Share sends a rich **`company_card`** into chats. Incomplete face → kit Chip completeness (lime attention), not a foam banner.
5. Catalogue section appears **only** when the viewer (here, the owner) has accessible collections or designs; otherwise omit it — no empty placeholder, no force-create. Home shows a few published rows plus **View more…** to **My collections** on the **same kind** (Designs → `/more?tab=products`). Home writes `/?tab=products|collections` when the trader picks a tab; You **Back** returns to that Home tab (Designs stays Designs). Selected catalogue tab = Orders underline (`underlineTabChrome`); white catalogue body; lime is Chip/counts only. Manage the full library on You (`/more`). Visitor shops use the same preview length with **View all…** to that shop’s catalogue page (see [company](./company.md)).
6. **Team** (below Contacts): names of people on the shop; tap for Invite / Edit team. Business info / Contacts / Team titles are ink (not muted); row icons accent.
7. Own `/company/:selfId` **redirects to `/`**. Own `/company/:selfId/catalogue` **redirects to `/more`**.

Former Needs / Followed / Market composition is **removed** from Home. Those workflows live on **Chats**, **Orders**, **Explore**, **Network**, and the bell.

## Business rules

- Profile access, collection audience, Connection/phones, and chat stay **separate** (see [company](./company.md), [access-and-connections](./access-and-connections.md)).
- Notifications remain on the bell — not rebuilt as a Home Needs list.
- Session/tenant cache clear on logout/login still applies so a new signup never greets the previous company’s Home.

## Edge cases / empty states

- Zero collections/designs → full identity + cover/showcase still work; no catalogue section.
- Missing cover → quiet Add cover (own edit); missing logo → initials.
- Loading: loading block until company query settles.

## Seed walkthrough

1. As **Ravi**: open Home — expect **Surat Silk House** Business Profile (not Needs rows).
2. As **Meena**: open Home — expect **Jaipur Emporium** profile; Edit cover / Showcase with separate controls.
3. Confirm Chats unread, Orders needs, and Explore still carry attention/discovery.

## Where it lives

- Web: own Business Profile on `/` (shared chrome with shop profile); Completeness `docs/superpowers/reviews/completeness/2026-11-15-business-profile-home-showcase-completeness.md`; professional chrome `docs/superpowers/reviews/completeness/2026-11-17-professional-home-orders-tab-chrome-completeness.md`
- Legacy attention helpers (`homeAttention.ts`) may remain for Orders/other reuse until cleaned; they are **not** the Home page
