# Feature Completeness Review — Orders list protocol (no list buttons)

**Date:** 2026-10-21  
**Module / ask:** Orders list: Selling / Buying / Others teal text (no foam fill); keep Pending / Completed; thin left Needs you edge; drop Confirm / Accept / Decline on the listing; print `Needs you ·` verbs (Accept & forward for I-handle).  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, `2026-10-19-orders-list-tabs-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two status chips stay. The list is a scan, not a desk — Confirm / Accept / Decline belong on the ticket. Needs you copy is the verb, not “Waiting for you…” or “Dispatch pending”. Trader holding mill lots: **Accept & forward**. |
| UX Designer | Selected tab is teal type + underline, not a foam slab. Needs you = thin left teal + one teal protocol line. Whole card is one tap. |
| Solution Architect | No new APIs. Delete list POST confirm/accept/decline. `tradeNeedsYouLabel` is the protocol string. I-handle mill Send stays on the ticket. |

---

## Platform consistency (required)

1. **Existing patterns?** Selling / Buying / Others; Pending / Completed; kit cards; ticket docks.  
2. **Duplicates another feature?** No — ticket still owns Confirm / Dispatch / Send.  
3. **Should reuse an existing workflow?** Yes — `tradeNeedsYouLabel` / `traderIHandleNeedsYou`.  
4. **Naming matches the app?** Needs you · Confirm / Dispatch / Accept quote / Accept & forward.

**Philosophy conflict?** No. Third status bucket stays rejected. List buttons were a convenience; tap-to-ticket is the shorter path.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tabs, chips, protocol, no row writes |
| Business rules | OK | I-handle parent still no list Confirm |
| Workflows | OK | Ticket Confirm / Decline / Dispatch / Send unchanged |
| Edge cases | OK | Samples/complaints use same Needs you · line |
| Permissions | OK | No list mutations |
| User states | OK | Tab session unchanged |
| Notifications | N/A | Nav Needs you count unchanged |
| Error handling | N/A | No list writes |
| Scalability | N/A | |
| Mobile interactions | OK | One tap; no extra sticky |
| First glance (BM-11) | OK | Shop + Needs you verb; no Confirm slab |
| Accessibility | OK | Tabs still named; card is a link |
| Platform consistency | OK | Pending / Completed stay |

---

## Gaps

### G-001 — Idle “Forwarded to…” copy

| Field | Content |
|-------|---------|
| Gap | Prototype In progress rows say Forwarded to {mill}. Ekum idle protocol still uses ship / context. |
| Why it matters | Scan of waiting-on-other-shop rows. |
| Recommendation | Keep current idle line this slice. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Direction tabs: `text-accent` + underline; no `bg-foam`.
- Pending / Completed unchanged.
- Needs you: `border-l-2` teal; protocol = `tradeNeedsYouLabel`.
- I-handle held lots: `Needs you · Accept & forward`.
- Remove list Confirm / Accept / Decline.
- Ticket mill Send unchanged.

## Explicitly deferred / rejected

- Needs action / In progress / Closed chips.
- List Forward / Send / Dispatch buttons.
- Idle “Forwarded to…” copy.
- Changing mill-card Send / “Your move: Send to…”.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
