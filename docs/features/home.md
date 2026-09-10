# Home

## Purpose

Home is a **state-driven attention surface**: act on what needs you, then catch up on followed suppliers or market opportunity. It is not a notification inbox.

## Who uses it

Both buyers and sellers. Content depends on trade presence and network.

## User flows

Home composes data from access requests, orders, returns, pending chat requests, followed feed, and Explore opportunities.

| Mode | When | What you see |
|------|------|----------------|
| **Needs you** | There are actionable items | Access to approve, chat requests, order/return verbs (Send rate, Confirm, Dispatch, …) |
| **Followed hero** | Quiet needs + followed posts | Recent posts from companies you follow — **grouped by company** with a count when they posted more than once |
| **From the market** | Quiet + market signal | Relevance-ranked opportunity posts — **grouped by company** (count when several) |
| **New packs** | Curated packs received in the last 7 days | Pack name · publisher · day → album; See all → Explore Buying |
| **Explore businesses** | Empty / cold start | Prompt to discover companies |

Actions: open the related order, chat, buyer request, collection, or company; expand “show all” on long Needs lists.

## Business rules

- **Notifications are not on Home** — use the bell (`/notifications`). Home is action-oriented, not a duplicate alert feed.
- Needs rows use attention verbs derived from order/return/access/chat state (`homeAttention.ts`).
- **Order needs group by opposite company + action** (e.g. `38 to dispatch · Jaipur Emporium`), not one row per order.
- **Attention center (Home composition):** greeting → live “N item(s) need attention” → compact existing metric cards (orders / requests / returns that need you, nonzero only) → the **need list is the hero**. Metrics stay subordinate. Do not use a single oversized KPI tile.
- **Viewed needs stay hidden** (device-local per company) until that bucket has newer activity. Rows also clear when the underlying work is done.
- Blocked / invisible companies never appear in followed or market previews (server visibility).
- Buying vs selling toggles influence which empty prompts and metrics feel relevant, but Needs still surfaces anything that requires the company.
- **New packs:** light **received curated packs** (last 7 days, cap 5) — pack name · publisher · day. Not a dense shares-by-day inbox; that browse lives under Explore **Buying**. See [concepts](./00-concepts.md) (Platform & dual-network).

## Edge cases / empty states

- **Cold start** (no Needs, no follows): do **not** say “Everything’s up to date.” Guide the user to Explore (find businesses / browse the market).
- **Quiet with signal** (no Needs, but market / followed / recommended content): “Nothing needs you” plus soft “Explore what’s new…” — still not a false “caught up” claim on a cold start.
- No needs, no follows, thin market → Explore businesses CTA.
- Loading: skeleton / loading block until queries settle.
- Own company identity is **not** a hero “control centre” on Home — avatar is only the You entry.

## From the market / Followed

Home shows a short **attention shelf**, not the full Explore stream:

- **One row per company** for Followed and From the market. If a company has several new designs/collections, the title shows the count (e.g. `4 new posts · Surat Silk House`); a single post uses `New post · {name}` plus the design/collection name.
- **Tap:** one post → that design/collection; **several posts** → Explore filtered to that company (`?story=`) with **newest first**, so the new work sits on top of the listing.
- Preview cap ~5 company rows. Explore All remains a full post feed (no Home-style count grouping there).

## Identity / session

Logout and login clear the React Query tenant cache so a new signup never greets the previous company’s Home. Onboarding company-create seeds `['company','me']` from the API response.

## Seed walkthrough

1. As **Meena**: open Home — expect Needs or followed/market content from Surat Silk House connection + orders.
2. As **Ravi**: open Home — expect order-related Needs (e.g. confirm / rates) from the seeded requested order.
3. Confirm the bell shows notifications separately from Home rows.

## Where it lives

- Web: `apps/web/src/features/home/HomePage.tsx`, `homeAttention.ts`
- Plan note: `docs/superpowers/plans/2026-08-05-home-needs-you.md`
- APIs composed: access-requests, orders, returns, threads (`pending`), follows, explore feed
