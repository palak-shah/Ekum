# Feature gap matrix

**Updated:** 2026-08-24  
**Source:** Completeness reviews under `docs/superpowers/reviews/completeness/`  
**Tracks:** Regression (`@smoke @regression` / BM-* units) · Functional (`@functional`)

Product status: Works · Partial · Missing · Later · Rejected · Redesign  
Verification: Functional · Regression · Unit-only · Untested

| Module | Capability | Product status | Verification | Completeness priority | Notes |
|--------|------------|----------------|--------------|----------------------|-------|
| Chat | Seeded thread text send | Works | Functional + Regression | Required | Green 2026-08-11 |
| Chat | In-thread search scopes + stepper | Works | Functional | Required | Green 2026-08-24: All/Photos/Collections/Designs/Orders |
| Chat | Thread list `view`/`q` API + index | Works | Unit + Functional | Required | Restored WIP 2026-08-11; Completeness thread-message-filters |
| Chat | Inbox deep search + why-line | Works | Unit + Functional | Required | Completeness 2026-08-24-chat-search-deep; `GET /threads?q=` |
| Chat | Attach search + multi-share | Works | Unit + Functional | Required | Completeness 2026-08-24-chat-attach-multi-share |
| Chat | Leave guard (composer / attach WIP) | Works | Functional | Required | Completeness 2026-08-24-discard-guard |
| Chat | Requests inbox (unconnected) | Works | Untested | Recommended | Later slice |
| Chat | Pin / mute / groups | Later | Untested | Future / Reject groups-as-Slack | Doc deferred |
| Chat | Share catalog cards in thread | Works | Untested | Recommended | |
| Orders | Core trade request→quote→accept | Works | Functional | Required | Green 2026-08-11 |
| Orders | BM-05 Accept quote gating | Works | Functional | Required | Green 2026-08-11; living-order-accept Completeness |
| Orders | Living upsert + `canAcceptQuote`/`hasSellerQuote` | Works | Unit + Functional | Required | Restored WIP 2026-08-11 |
| Orders | Orders More menu portal (Samples/Returns) | Works | Untested | Recommended | Chrome overflow fix |
| Orders | Order card +N thumbs | Works | Regression | Required | BM-01 |
| Orders | Living card dedupe helpers | Works | Unit-only | Required | BM-04 |
| Orders | Dispatch → deliver | Works | Untested | Future | |
| Orders | Payment request (honour ask / Paid / Mark received) | Works | Unit-only | Required | Completeness 2026-08-22; no gateway |
| Orders | Buy for buyer (log ticket; OTP Accept) | Works | Unit-only | Required | How many each Who; /o/:token |
| Collections | 48h share link | Works | Unit-only | Required | Completeness 2026-08-22; Everyone look-only; closed card + Request |
| Orders | Photo order / amend / samples / returns | Partial | Untested | Future | |
| Orders | Leave guard (photo order + builders) | Works | Unit + Functional | Required | Completeness 2026-08-24-discard-guard; shared sheet |
| Orders | Trade without connection | Rejected | — | Reject | Trust ladder |
| Collections | Buyer view Wedding Edit + shortlist clear | Works | Functional | Required | Green 2026-08-11 (BM-03) |
| Collections | Seller create photos-first + cover tag | Works | Unit | Required | Slice 1 2026-08-12; functional journey Recommended next |
| Collections | Seller create/publish / quick-add (edit) | Works | Untested | Recommended | |
| Collections | Buyer groups (elevate broadcast lists) | Works | Unit | Required | 2026-08-13 Completeness |
| Collections | No-forward (usual → group → sheet + API) | Works | Unit | Required | 2026-08-13 no-forward |
| Collections | Ready status + seller badges/filters | Works | Unit | Required | 2026-08-13 Completeness |
| Collections | Live window startsAt/endsAt + expire | Works | Unit | Required | 2026-08-13 Completeness |
| Collections | Seller informed catalog (collage + viewer) | Works | Unit | Required | 2026-08-13 Completeness |
| Explore | Browse seeded + open detail | Works | Functional | Required | Green 2026-08-11 |
| Explore | Filter dismiss BM-02 | Works | Functional | Required | Green 2026-08-11 |
| Explore | Federated search / follow feed | Works | Untested | Future | |
| Explore | Businesses for you + Stories rail | Works | Unit | Recommended | Stories = follow/connected + published (Slice C) |
| Explore | Trade-side Buying / Selling (no All chip) | Works | Unit | Required | 2026-08-23 filter panels; dual Explore Buyers / Explore Suppliers; default Buying |
| Explore | Filter: Change View + multi category/city | Works | Unit + Functional | Required | Popup B; Confirm closes; pin selected on reopen |
| Explore | Buying: Following-first posts + received by day/business | Works | Unit | Required | Slice C; not mixed into market ranking |
| Explore | Selling: Buyers for you (not My Catalog) | Works | Unit | Required | Buyers shelf on Selling / All when you sell |
| Explore | Vanity likes ranking | Rejected | — | Reject | |
| Team | Invite staff + five caps + owner-only chat | Partial | Unit-only | Required | You → Team; `/t/:token` join; staff seed +919800000004 |
| Network | Following / Followers lists | Works | Unit-only | Required | You → Network hub pages restored 2026-08-20 |
| Network | Connections hub (both roles) + Requests | Works | Unit-only | Required | `/network/connections` + `/network/requests` |
| Referrals | Connect-with-me invite create + Share/Copy | Works | Unit | Required | `＋` / Network → Invites; link-only share; referral.service.spec |
| Referrals | Open invite redeem → access request (approve gate) | Works | Unit | Required | Not auto-connect; `referredBy: Invite` |
| Referrals | Login/onboarding return path (`?invite=` / `/r/:token`) | Works | Unit-only | Required | `inviteReturn` + Login/onboarding wiring |
| Referrals | Targeted vouch (optional target company) | Works | Untested | Recommended | Seller still approves |
| Referrals | Auto-connect / auto-follow on redeem | Rejected | — | Reject | Trust ladder |
| Trader curation | Dual network (suppliers + buyers) via Connections/Follow | Partial | Untested | Required | Platform 1-hop; long chain possible |
| Trader curation | Multi-supplier pick → curated collection for buyers | Works | Unit-only | Required | Slice A; `＋` Curate pack; `canRelist` on first curated publish; see `docs/features/saved.md` |
| Trader curation | Saved hub (design + collection **references**) | Works | Unit-only | Required | Slice A; You → Saved; Explore/viewer Save; `saved.service.spec` |
| Trader curation | Publish curated collection to Explore (buyers / broader audience) | Works | Unit-only | Required | Slice A; same publish sheet as own collections; functional e2e Recommended next |
| Trader curation | Curate within original seller permission (forward/audience) | Works | Unit-only | Required | Slice A; `curation-ceiling` + collection membership specs |
| Trader curation | Deliver curated pack (broadcast / chat) | Partial | Untested | Required | Broadcast exists |
| Trader curation | Home: received curated packs (attention) | Works | Unit | Required | Slice C; New packs 7 days / cap 5 |
| Trader curation | Explore Buying: received by day/business | Works | Unit | Required | Slice C; directed audience or broadcast |
| Trader curation | Split order by product’s real supplier | Works | Unit | Required | Slice B; batch + Manage upstream |
| Trader curation | Dual trade: pay/order upstream + sell/send orders to buyers | Works | Unit | Required | Direct vs I handle; Send-hold until Send/Change; soft-hide only |
| Trader curation | Middleman in-loop + optional anonymity (multi-hop) | Later | — | Future | 2026-08-22: no hard Connection/chat block; tickets still hide the other end |
| Trader curation | Trader attention UX (buy / curate / share / follow-up) | Missing | — | Required | WhatsApp-simple |
| Trader curation | Trader insights (vendor↔trader analytics) | Later | — | Future | |
| Trader curation | Dedicated Trader role at OTP | Rejected | — | Reject | One company account |
| Trader curation | Trader/Seller badges on Explore | Rejected | — | Reject | Opaque businesses |
| Trader curation | Home-only dense day/trader share analytics | Rejected | — | Reject | Use Explore Buying + Home attention |
| Media | Chat photo send | Works | Functional | Required | Green 2026-08-11 |
| Media | Shared WhatsApp-style photo viewer (pinch/zoom) | Works | Unit | Required | Completeness 2026-08-21; kit + chat + sheets + Explore design |
| Media | Catalog design upload | Works | Untested | Future | |
| Media | Top-level Media tab | Rejected | — | Reject | |
| Media | Upload failure UX | Partial | Untested | Recommended | |

| Collections | Fixed select bar clips last card (BM-07) | Works | Untested (manual fix 2026-08-11) | Required | Padding clears nav + bar; add regression when practical |
| Browse | Select all float as soon as select starts | Works | Unit | Required | Completeness 2026-08-21; spec select-all-float; not on Explore |

## Doc drift

- Design spec “Problem” section historically stale vs Wave 1 — check status line.
- UI chrome clearance is now Required in `ui-quality-bar` §2b / Completeness mobile checklist.
- Referrals / Share invite: product rules in `docs/features/referrals.md`; no Completeness review under `docs/superpowers/reviews/completeness/` yet (matrix tracks Required + Untested).
- Trader curation / platform chain: [mvp-garmenthub-gap-matrix.md](./mvp-garmenthub-gap-matrix.md); [slice-a design](../specs/2026-08-19-trader-curation-slice-a-design.md) (**Implemented**); product walkthrough in [saved.md](../features/saved.md). Slices B–D remain; dual trade order linking = B.
