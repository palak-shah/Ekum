# Feature Completeness Review — Orders list tabs

**Date:** 2026-09-19  
**Module / ask:** Orders list: replace three attention tabs (Needs you / In progress / Completed) with **Pending** + **Completed**; surface **Needs you** as a per-row label when the signed-in company must act.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/home.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Three tabs duplicate the same open trades (Needs ⊂ Progress). Traders want one open bucket + finished. Action urgency moves to the row, matching Home “Needs you” language without a second list. |
| UX Designer | Two chips fit mobile chrome better (BM-07). Keep StatusPill; add a quiet accent **Needs you** above it when actionable. Pending sorts needs-first so action work stays scannable. |
| Solution Architect | Reuse `matchesNeeds` / `matchesCompleted`; Pending = not completed (same as today’s In progress set). Legacy `?filter=needs|progress` → Pending. Home deep links unchanged in meaning. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — FilterRail chips, StatusPill, Home “Needs you” wording, Buy/Sell stacked under attention.  
2. **Duplicates another feature?** No — removes duplication between Needs you and In progress.  
3. **Should reuse an existing workflow?** Yes — existing `orderAttention` / `tradeList` matchers; Home still links `?filter=needs`.  
4. **Naming matches the app?** **Pending** / **Completed** / row **Needs you** — plain trader language; same verb as Home.

**Philosophy check:** Fits simplicity (one job per list, fewer taps, no duplicate rows across tabs). No conflict.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Two tabs; Needs you label on actionable rows |
| Business rules | OK | Pending = open (not completed); Needs = existing action matchers |
| Workflows | OK | Find still overrides attention chips |
| Edge cases | OK | Legacy filter aliases; samples/returns same rules |
| Permissions | N/A | Direction already on the order view |
| User states | OK | Buyer waiting vs seller act — keep current `matchesNeeds` |
| Notifications | N/A | Home metrics still deep-link needs → Pending |
| Error handling | N/A | List-only |
| Scalability | OK | Client filter unchanged |
| Mobile interactions | OK | Two chips + stacked Buy/Sell; BM-07 stacking kept |
| Accessibility | OK | Label + StatusPill; aria via existing Chip/Link |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Empty copy for Pending

| Field | Content |
|-------|---------|
| Gap | “Nothing needs you” empty state vanishes with the Needs tab |
| Why it matters | Pending empty ≠ “caught up on actions” |
| Impact if ignored | Confusing empty title |
| Recommendation | Pending: “No open orders”; Completed: “No completed orders” |
| Priority | Required before implementation |

### G-002 — Home `?filter=needs`

| Field | Content |
|-------|---------|
| Gap | Home / metrics still use `filter=needs` |
| Why it matters | Deep links must land on open work |
| Impact if ignored | Broken Home → Orders |
| Recommendation | Alias `needs` and `progress` → Pending tab (URL may stay) |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Orders chips: **Pending** | **Completed** only (default Pending).
- Pending = not completed (orders/samples/returns); Completed unchanged.
- Row label **Needs you** (accent) when `matchesTradeNeeds`, above StatusPill; sort Needs first within Pending.
- Legacy `?filter=needs|progress` → Pending; `completed` → Completed; prefer writing `filter=pending` on chip tap.
- Docs (`orders.md`), unit tests, light e2e chrome assert; gap matrix note.

## Explicitly deferred / rejected

- Changing Home Needs wording or grouping.
- Replacing StatusPill with Needs you.
- Narrowing return “needs” to seller-only (keep current matchers).
- Server-side attention filter.

## Sign-off

| Role | Outcome |
|------|---------|
| PM + UX + Architect (this review) | **Proceed** |
