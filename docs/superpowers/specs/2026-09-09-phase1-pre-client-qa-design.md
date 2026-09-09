# Phase 1 pre-client QA — design

**Date:** 2026-09-09  
**Status:** Active  
**Goal:** Before client demo / release URL, catch functional, UX/UI, and **irrelevant error** defects as a naive end user would — whole app, unified flow.

## Context

Phase 1 is the **full product surface** (no demo fence): Home, Chats, Explore, Create, Orders, You, Selection/Curate/Saved, Network/referrals, Team, Samples/Returns, Your paths, TradeLane/Mills, share links, guest paths.

Automation alone is not enough. Clients will tap anything; false-alarm toasts during unrelated work feel like a broken app.

## Approach (locked): Chaos + automation

| Gate | Name | Purpose |
|------|------|---------|
| **0** | Green machine | Units + `pnpm test:e2e:smoke` + `pnpm test:e2e:functional` green |
| **0.5** | Error hygiene | Every user-visible error must belong to the journey in progress |
| **1** | Persona chaos | Naive trader sessions across all surfaces |
| **2** | UX/UI bar | Mobile viewport vs `ui-quality-bar` + BM-07 |
| **3** | Ship decision | Blockers fixed; majors fixed or deferred with client note |

## Gate 0 — Green machine

1. `pnpm test` (API + web units)  
2. `pnpm test:e2e:smoke`  
3. `pnpm test:e2e:functional`  
4. Fix failures (prefer product truth over stale assertions — e.g. Mark delivered retired).

## Gate 0.5 — Error hygiene

While doing any journey, log: **action → exact toast/InlineNotice/console user-visible text → did the job still succeed?**

| Class | Meaning | Pre-URL action |
|-------|---------|----------------|
| **A — False alarm** | Success + wrong/leftover error | **Blocker** — fix or suppress |
| **B — Side-channel** | Noise from another query/socket/tab | **Blocker** if user-visible |
| **C — Bad copy** | Real fail, jargon/raw codes | **Major** — plain trader words |
| **D — Expected deny** | Trust ladder, caps, pack lock | Keep; one clear place |

Known hygiene debt to clear or confirm: stale `DIRECT_PACK` web fallback; background refetch danger toasts; raw API codes in UI.

## Gate 1 — Persona chaos (end user, not system expert)

Personas: **Meena** (buyer), **Ravi** / **Kavita** (mills), **trader desk**, **staff (capped)**, **guest / share link**.

For each: walk main chrome + Create + Selection/Curate/Saved + Network/Team + Samples/Returns + Your paths + TradeLane. Deliberately: abandon sheets, double-tap, Back mid-flow, empty states, wrong persona actions. Goal: get lost, recover, no hard crash, no Class A/B noise.

Output: findings log with severity **Blocker / Major / Polish**.

## Gate 2 — UX/UI bar

Mobile viewport with sticky chrome active: one job/screen, no clipped content (BM-07), no shell flicker, kit consistency, plain copy. Screenshot or note each fail.

## Gate 3 — Ship decision

- **Ship URL** only when Blockers = 0.  
- Majors: fix or list in a short **client known-limits** note.  
- Polish: backlog.

## Out of scope

- Pixel visual regression service (Percy/Chromatic)  
- Load/perf as primary  
- Claiming “clients won’t find anything” — only “we ran naive chaos + automation first”

## Success

You can demo and share the URL knowing: automation is green, chaos covered the unified flow, and visible errors are honest for the action the trader just took.
