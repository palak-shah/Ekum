# Feature Completeness Review — You library: Find holds Draft / Archived / Saved

**Date:** 2026-09-29  
**Module / ask:** You → Collections and Designs: no Draft / Archived / Saved chips on the page. Those are **Find** filters. No **Published** chip — the list *is* published.  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/settings.md`, ui-quality-bar (one tight chrome row; rare lists not peer tabs)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Everyday job is live packs/designs. Draft, archive, and bookmarks are hunt jobs — same door as Find. |
| UX Designer | Resting chrome: Designs / Collections + Find + Grid + Add. Find open: field + chips **Draft · Archived · Saved**. Close Find returns to published. Save-in-draft still opens Find on Draft. `/saved` still lands Saved. |
| Solution Architect | Status filter state unchanged; persistence of last chip as You landing is dropped (it fought published-first). |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Chip + FilterRail + SearchInput (same as current Find).  
2. **Duplicates another feature?** No — relocates existing chips.  
3. **Should reuse an existing workflow?** You Find, not a new Settings page.  
4. **Naming matches the app?** Draft / Archived / Saved stay.

**Philosophy conflict?** No — fewer everyday chips.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Default published; Find for the rest |
| Business rules | OK | Select docks still keyed off filter |
| Workflows | OK | Editor → draft Find; bookmark → Saved Find |
| Edge cases | OK | Close Find clears Saved URL |
| Permissions | N/A | |
| User states | OK | Buyers: Find still has Saved |
| Notifications | N/A | |
| Error handling | OK | Empty copy per filter |
| Scalability | N/A | |
| Mobile interactions | OK | Find chips only while Find open |
| Accessibility | OK | Find aria-expanded; chip labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Last chip remembered on device

| Field | Content |
|-------|---------|
| Gap | You no longer reopens on Draft because that hid published. |
| Why it matters | Traders in a long draft session lose the chip after leaving You. |
| Impact if ignored | One extra Find → Draft. |
| Recommendation | Accept. Editor save still opens Draft Find. |
| Priority | Deferred |

---

## Approved scope for this slice

- You Designs / Collections: no status chips on the resting page.
- Find opens **search + filter square** (Orders / Explore). Filter menu: **Draft · Archived · Saved**. No Published row. Close Find → published. Active filter: **Showing …** + Clear.

## Explicitly deferred / rejected

- Remembering Draft as the You landing.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
