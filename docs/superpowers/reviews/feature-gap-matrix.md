# Feature gap matrix

**Updated:** 2026-08-13  
**Source:** Completeness reviews under `docs/superpowers/reviews/completeness/`  
**Tracks:** Regression (`@smoke @regression` / BM-* units) · Functional (`@functional`)

Product status: Works · Partial · Missing · Later · Rejected · Redesign  
Verification: Functional · Regression · Unit-only · Untested

| Module | Capability | Product status | Verification | Completeness priority | Notes |
|--------|------------|----------------|--------------|----------------------|-------|
| Chat | Seeded thread text send | Works | Functional + Regression | Required | Green 2026-08-11 |
| Chat | In-thread search scopes + stepper | Works | Functional | Required | Green 2026-08-11 |
| Chat | Thread list `view`/`q` API + index | Works | Unit + Functional | Required | Restored WIP 2026-08-11; Completeness thread-message-filters |
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
| Orders | Photo order / amend / samples / returns | Partial | Untested | Future | |
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
| Explore | Vanity likes ranking | Rejected | — | Reject | |
| Media | Chat photo send | Works | Functional | Required | Green 2026-08-11 |
| Media | Catalog design upload | Works | Untested | Future | |
| Media | Top-level Media tab | Rejected | — | Reject | |
| Media | Upload failure UX | Partial | Untested | Recommended | |

| Collections | Fixed select bar clips last card (BM-07) | Works | Untested (manual fix 2026-08-11) | Required | Padding clears nav + bar; add regression when practical |

## Doc drift

- Design spec “Problem” section historically stale vs Wave 1 — check status line.
- UI chrome clearance is now Required in `ui-quality-bar` §2b / Completeness mobile checklist.
