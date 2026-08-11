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
| **Followed hero** | Quiet needs + followed posts | Recent posts from companies you follow |
| **From the market** | Quiet + market signal | Relevance-ranked opportunity posts |
| **Explore businesses** | Empty / cold start | Prompt to discover companies |

Actions: open the related order, chat, buyer request, collection, or company; expand “show all” on long Needs lists.

## Business rules

- **Notifications are not on Home** — use the bell (`/notifications`). Home is action-oriented, not a duplicate alert feed.
- Needs rows use attention verbs derived from order/return/access/chat state (`homeAttention.ts`).
- Blocked / invisible companies never appear in followed or market previews (server visibility).
- Buying vs selling toggles influence which empty prompts and metrics feel relevant, but Needs still surfaces anything that requires the company.

## Edge cases / empty states

- No needs, no follows, thin market → Explore businesses CTA.
- Loading: skeleton / loading block until queries settle.
- Own company identity is **not** a hero “control centre” on Home — avatar is only the You entry.

## Seed walkthrough

1. As **Meena**: open Home — expect Needs or followed/market content from Surat Silk House connection + orders.
2. As **Ravi**: open Home — expect order-related Needs (e.g. confirm / rates) from the seeded requested order.
3. Confirm the bell shows notifications separately from Home rows.

## Where it lives

- Web: `apps/web/src/features/home/HomePage.tsx`, `homeAttention.ts`
- Plan note: `docs/superpowers/plans/2026-08-05-home-needs-you.md`
- APIs composed: access-requests, orders, returns, threads (`pending`), follows, explore feed
