# Ekum — feature documentation

Product-functional docs for Phase 1: what users can do, the business rules that must hold, and how to walk through flows with seed data. Each file also has a short **Where it lives** footer for developers. This is not an API reference.

## Product model

Ekum is a **B2B textile trade PWA**. One **company account** (no buyer/seller role picker). Buying and selling capabilities appear as data; **publish** unlocks on first “start selling” consent. Discover → showcase → chat → order, under server-enforced visibility and contact protection.

Start with [Shared concepts](./00-concepts.md) before area docs.

## App chrome (IA)

| Control | Role |
|---------|------|
| **Home · Chats · ＋ · Explore · Orders** | Bottom nav (`AppShell`) |
| **＋ sheet** | Buying: Photo order. Selling: Add designs, New collection, **Curate pack**, Broadcast (if `canPublish`). **Invite to connect** (all companies). Find suppliers via **Explore**. |
| **Bell** | Notifications only — not mirrored on Home |
| **Avatar → You** | `/more` — catalog, **Saved**, **Network**, samples, returns, settings, logout |

## Seed personas

Run `pnpm --filter @ekum/api db:seed`. OTP uses the app’s configured Dev code.

| Person | Phone | Business | Typical role |
|--------|-------|----------|--------------|
| **Ravi** | `+919800000001` | Surat Silk House (Surat) | Supplier — can publish & refer, GST verified |
| **Meena** | `+919800000002` | Jaipur Emporium (Jaipur) | Retailer / buyer |
| **Kavita** | `+919800000003` | Ahmedabad Loom Co (Ahmedabad) | Peer fabric supplier (Explore content for Ravi) |

Seed includes published designs + “Wedding Edit 2026”, peer fabric catalog for Ravi’s Explore, follow + active connection, orders, a chat thread, and sample notifications.

## Index

| Doc | Area |
|-----|------|
| [Shared concepts](./00-concepts.md) | Vocabulary & trust model |
| [Auth](./auth.md) | OTP login & session |
| [Onboarding](./onboarding.md) | Create company |
| [Home](./home.md) | Needs you / Followed / market |
| [Catalog (designs)](./catalog.md) | Design library, publish, Explore post |
| [Collections](./collections.md) | Albums of designs |
| [Saved & Curate pack](./saved.md) | Reference shortlist; multi-supplier curated packs |
| [Explore & search](./explore.md) | Discovery feed |
| [Company profile](./company.md) | Public shop & own profile |
| [Access & connections](./access-and-connections.md) | Network hub, follow, access, pause, block |
| [Chat](./chat.md) | Threads & cards |
| [Orders, samples, returns](./orders.md) | Trade lifecycle |
| [Broadcast](./broadcast.md) | Message buyers |
| [Referrals](./referrals.md) | Connect-with-me invites / vouch links |
| [Notifications](./notifications.md) | Bell feed & prefs |
| [Settings](./settings.md) | You menu & trade presence |
| [Media](./media.md) | Photos used across the app |

## How to maintain

- Prefer updating the area file when behavior changes; keep [concepts](./00-concepts.md) for cross-cutting vocabulary.
- Derive rules from `@ekum/domain-types` and API services — do not invent client-only rules.
