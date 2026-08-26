# GarmentHub MVP → Ekum gap matrix

**Updated:** 2026-08-19  
**Source:** GarmentHub MVP (CUSTOMER / TRADER / VENDOR / ADMIN) vs Ekum unified company model  
**Related:** [feature-gap-matrix.md](./feature-gap-matrix.md), [docs/features/00-concepts.md](../../features/00-concepts.md), [docs/features/explore.md](../../features/explore.md)

Status: **Covered** · **Partial** · **Missing** · **Intentional redesign** · **Later** · **Rejected**

No product code in this review — decisions only. Design specs before implementation.

## Role model / platform

| MVP | Ekum |
|-----|------|
| Pick Buyer / Trader / Supplier at OTP (+ Admin) | One **company**; buy/sell via presence + capabilities |
| Separate shells per role | One shell: Home · Chats · ＋ · Explore · Orders |

**Platform:** each company knows **its** sellers and **its** buyers (1-hop). Product may travel a **long chain**; UI does not force a full-chain map. Counterparties are opaque **businesses** (no Trader/Seller badges). Dual-network companies curate/publish without a third OTP role. Capability **`relist`** gates curated publish.

## Coverage matrix

### Auth & onboarding

| MVP | Ekum | Status |
|-----|------|--------|
| Phone OTP | OTP login | Covered |
| Role picker on signup | Company create + trade presence | Intentional redesign |
| Invite code at login (`connectViaInvite`) | Referrals `/r/:token` + access request (approve gate) | Partial — mapped; not auto-connect |

### Discovery & network

| MVP | Ekum | Status |
|-----|------|--------|
| Product search/listing | Explore + search | Covered |
| Product detail | Design / company / collection views | Covered |
| Network / People: follow, suggestions, connections | Network hub + Explore Businesses for you / Stories | Partial |
| Explore All / Buying / Selling | Trade-side filter; Following-first under Buying | Covered |
| Stories follow/connected + published | Follow/connected + published | Covered |
| Vendor↔trader link + **Trader insights** | — | Later |
| Share invite code | Referrals create + Share/Copy | Covered (verification Untested) |

### Catalog (supplier)

| MVP | Ekum | Status |
|-----|------|--------|
| Products CRUD / upload | Catalog + batch + media | Covered |
| Brands list | Categories / company — no Brands entity | Rejected (Drop brands entity) |
| Vendor catalog view | My catalog / shop | Covered |
| Admin category settings | Seeded / platform categories | Later (no admin UI) |

### Trader curation

| MVP | Ekum (planned / today) | Status |
|-----|------------------------|--------|
| Share products to buyers/groups (+ WhatsApp) | Broadcast + chat cards; curated **publish** to Explore | Partial today; curated publish **Missing** |
| Customer groups | Buyer groups / broadcast lists | Covered |
| Buyer Home = received shares | **Home**: light attention on new received packs | Covered |
| Shares by day / by business | **Explore → Buying**: received browse (not Selling / not market ranking) | Covered |
| Shared galleries | Collections + chat; curated collections on Explore | Partial; multi-supplier curate **Missing** |
| Curate from many suppliers → one pack | Within **original seller** forward/audience; `relist` | Keep / Missing |
| Forward vs Curate | Forward = share card; Curate = own collection then publish | Keep / Missing |
| Order from multi-supplier pack | Lines → **real product owner**; **split** per upstream | Keep / Missing |
| Middleman in-loop / anonymity along chain | Planned; multi-hop design open | Keep / Missing |
| OTP Trader role / third shell | — | Rejected |
| Home-only dense day/trader analytics | — | Rejected — Buying Explore + Home attention |
| Trader / Seller badges | — | Rejected |

### Orders

| MVP | Ekum | Status |
|-----|------|--------|
| Buyer orders + detail | Orders + detail | Covered |
| Vendor incoming + history | Unified Orders (buy/sell) | Covered |
| Bulk order DIRECT vs trader-managed | Dual trade: pay/order upstream + sell/send to buyers; split by real supplier | Partial / Missing — Slice B |
| Group qty packs (A–H) | HowManyEach presets | Partial (intentional simpler) |
| Samples / returns | Unified Orders + APIs | Covered |

### Buyer extras

| MVP | Ekum | Status |
|-----|------|--------|
| **Saved** products (bookmark tab) | **Saved** hub — design/collection **references**; feeds Curate pack | Missing (Keep → Slice A companion) |
| Chats | Chats (text/photo/voice/cards) | Covered |

### Platform

| MVP | Ekum | Status |
|-----|------|--------|
| Notifications | Bell + prefs | Covered |
| Profile | You / settings / company | Covered |
| **Admin** dashboard | — | Later (ops) |

## Highest-risk Missing (do not silently drop)

1. **Slice A:** Multi-supplier curation + publish (`relist`) within seller permission; **Saved** reference hub.
2. **Slice B:** Order split by real upstream supplier; trader **pays/orders upstream** and **sells/sends orders to buyers** (dual trade linking).
3. **Slice C:** Home received attention + Explore **All/Buying/Selling** + Following-first Buying + received by day/business. **Shipped 2026-08-22.**
4. **Slice D:** In-loop / anonymity along multi-hop chain — **Later** (no hard restriction now).
5. Invite path verification.

## Open for design spec

- Provenance for Slice A: **locked Reference** (see slice-a design); copies rejected
- Order split shape (N orders + optional parent); trader pay-upstream + sell-downstream linking (Slice B)
- Anonymity: soft (UX hide names) vs hard (no Connection edge between ends of chain)

## Decision log

| Capability | Decision | Ekum surface | Notes |
|------------|----------|--------------|-------|
| Platform 1-hop + long chain | Keep | Company network | Opaque businesses |
| Dual-network (no OTP role) | Keep / Map | Presence + `relist` | — |
| Multi-supplier → curated collection | Keep | Catalog (planned) | Slice A |
| Trader publish to Explore | Keep | Explore audience | — |
| Inherit seller forward/audience | Keep | `allowForward` ceiling | Forward ≠ Curate |
| Explore All / Buying / Selling | Keep | Explore | Slice C; default All |
| Buying = Following-first + received browse | Keep | Explore Buying | Follow is the lever |
| Selling = Buyers for you | Keep | Explore Selling | Not My Catalog |
| Stories follow/connected + published | Keep | Explore Stories | Tighten vs today Partial |
| No role badges | Reject badges | — | — |
| Home received packs | Keep | Home | Light attention |
| Order → real supplier; split | Keep | Orders | Slice B |
| Dual trade pay upstream + sell to buyers | Keep | Orders | Slice B; presence already dual |
| Middleman in-loop / anonymity | Later | Orders / visibility | Soft-hide only (2026-08-22); no Connection/chat block now |
| Insights | Later | — | — |
| Saved | Keep / Map | You → Saved + Curate picker | Slice A companion — references only |
| Brands | Drop | Categories | — |
| Admin | Later | Ops | — |
| OTP Trader role | Reject | — | — |
| Home-only GH share analytics | Reject | Explore Buying | — |

## Next step

Design spec: [2026-08-19-trader-curation-slice-a-design.md](../specs/2026-08-19-trader-curation-slice-a-design.md) (Slice A — Reference + Saved). Then writing-plans → implement Slice A only. Track rows in [feature-gap-matrix.md](./feature-gap-matrix.md).
