# Feature Completeness Review — Orders load more + tab counts + Needs you in filter

**Date:** 2026-11-18  
**Module / ask:** Orders list: Load more past 50; server Pending/Completed chip totals; Needs you findable via filter menu only (not a third chip; badge opens normal list)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`; chips Completeness `2026-10-23-orders-pending-chat-chips`; nav Needs you `2026-09-26-orders-nav-needs-you`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Badge N ≠ Pending N is a trust bug when traders only see 50 rows and chip counts echo the truncated list. Needs you must be findable without a third attention chip (clutter). Load more + server totals + filter Needs you closes the hole. |
| UX Designer | Chip row stays Pending · Completed (Orders language). Needs you sits in the filter menu; filter icon active when applied. Badge tap lands on that filter. Quiet empty: “Nothing needs you.” |
| Solution Architect | Reuse cursor pagination (`nextCursor`) already on GET `/orders`, `/samples`, `/complaints`. New COUNT-only `GET /orders/tab-counts` mirrors `needs-you-count`. List Needs you uses `matchesOrderNeedsYou` / `matchesTradeNeeds` (same as badge). |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Explore/ChatFind Load more; Chip rail; OrdersFilterMenu; underline tabs; `matchesOrderNeedsYou`.  
2. **Duplicates another feature?** No — findability for existing Needs you, not a new workflow.  
3. **Should reuse an existing workflow?** Yes — filter menu + deep link `?filter=needs`, not a third chip (avoids Redesign of two-chip Completeness).  
4. **Naming matches the app?** Needs you (same as badge / row cue). Pending / Completed unchanged.  
5. **Units?** N/A — no ₹ / qty string change.

**Philosophy conflict?** No — quieter filter findability matches “don’t put Needs you on screen” and one-job list chrome.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Load more; server pending/completed; Needs you in filter; badge deep link |
| Business rules | OK | Same Needs you predicate as badge; facilitator Observing excluded |
| Workflows | OK | Filter → Needs you; Clear / Pending|Completed chip clears it |
| Edge cases | OK | Empty Needs you while Pending > 0; search/`q` on counts; Others samples/complaints |
| Permissions | OK | Same party + hide-subset rules as list |
| User states | OK | Selling / Buying / Others scoped counts |
| Notifications | N/A | |
| Error handling | OK | Existing ErrorState / retry |
| Scalability | OK | COUNT queries; list still page 50; needsYou count path bounded like badge |
| Mobile interactions | OK | Load more above bottom nav; content clearance unchanged (BM-07) |
| First glance (BM-11) | OK | No third chip; filter active state; Pending chip unchanged on idle |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Menu radio / filter aria-pressed |
| Platform consistency | OK | Kit Chip + filter menu; Load more secondary Button |

---

## Gaps

### G-001 — Truncated list chip counts

| Field | Content |
|-------|---------|
| Gap | Pending/Completed N from first 50 rows only |
| Why it matters | Traders distrust badge vs chip |
| Impact if ignored | Support noise; wrong “done” feeling |
| Recommendation | Server tab-counts by tab |
| Priority | Required before implementation |

### G-002 — No Load more

| Field | Content |
|-------|---------|
| Gap | Hard `limit: 50` with no next page |
| Why it matters | Older open tickets invisible |
| Impact if ignored | Missed Confirm/Dispatch |
| Recommendation | `useInfiniteQuery` + Load more |
| Priority | Required before implementation |

### G-003 — Needs you not findable

| Field | Content |
|-------|---------|
| Gap | Badge counts Needs you; list has no way to open that set (`?filter=needs` remapped to Pending) |
| Why it matters | Badge without a landing list |
| Impact if ignored | Traders hunt inside Pending |
| Recommendation | Needs you in OrdersFilterMenu; `?filter=needs` activates it; no third chip |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + `docs/features/orders.md` locks above.
- `GET /orders/tab-counts?tab=selling|buying|others` (+ optional `q` / date) → `{ pending, completed, needsYou }`.
- Orders (and Others samples/complaints) infinite query + **Load more**.
- Pending / Completed chips bind to server totals for the active tab.
- OrdersFilterMenu root: **Needs you** option (opt-in only); badge opens `/orders` Pending; Home may still deep-link `?filter=needs`; **no Needs you Chip**.
- Units + trader-eye: no third chip; badge opens filtered list.

## Explicitly deferred / rejected

- Third attention chip on the rail (Rejected — product: filter only).
- Changing Needs you *rules* (Observing / I-handle / etc.).
- Sheet #26–#29 wait / transporter / MOQ.
- Perfect server-side cursor that returns exactly 50 Needs you rows after enrichment (Later if sparse desks need it); first ship filters loaded + open pages with Load more under the filter.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
