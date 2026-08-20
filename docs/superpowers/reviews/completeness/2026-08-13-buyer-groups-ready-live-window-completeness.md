# Feature Completeness Review — Buyer groups + Ready + live window + badges

**Date:** 2026-08-13  
**Verdict:** Proceed  
**Scope:** Elevate BroadcastList → Buyer groups; Collection `ready` status; `startsAt`/`endsAt` live window + expire job; informed seller My Catalog badges/filters.

## Product decisions

| Topic | Decision |
|-------|----------|
| Buyer groups | Same `BroadcastList` entity; fields `defaultRateVisibility`, `allowForward`; one CRUD under `/broadcast` |
| Ready | Company-only; publish from draft or ready; never Explore |
| Live window | `startsAt`/`endsAt`; null end = evergreen; expire → Hide to draft |
| Seller display | Collage tiles, filters, badges Live/Evergreen/Starts/Ends/Archived; tap → viewer + Edit |

## Reject / Later

| Item | Disposition |
|------|-------------|
| Slack-like chat groups | Reject |
| Top-level Media tab | Reject |
| Owner-only publish gate | Later |
| Chat hard no-forward enforce | Done (2026-08-13 follow-on: API + hide Forward) |
| Catalog in bottom nav | Later |

## Platform consistency

- Audience remains the buyer privacy control; Ready is team awareness; schedule is time.
- Hide language preserved (not auto-archive on end).
- Explore continues to exclude own company; sellers browse own albums via My Catalog.

## Verification

- Unit: collection ready/publish, schedule parse/live gates, schedule badges
- Functional journey Recommended next: Ravi filters + badge walkthrough
