# Feature Completeness Review — Select / Order from a shared design set

**Date:** 2026-10-01  
**Module / ask:** After sharing 2+ designs into chat (`View designs →` / `/designs/set`), the recipient cannot pick those designs to Order.  
**Anchors:** `docs/features/explore.md`, `docs/features/chat.md`, `docs/features/collections.md`, `2026-09-30-design-set-feed-completeness.md` (deferred Select / Order)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Share is how a folder of designs lands in a 1:1. The next job is the same as an album: pick what to Order / Ask rates. Forcing a detour through the shop or a real pack is extra hunting. Still **not** a Collection. |
| UX Designer | Same **Select** / **Selecting** as shop / album / Explore. Photo tap toggles; name still opens the design. **Select all** float. Traveling floater already allowed on `/designs/set`. PhotoViewer stays Quote (from chat) — no Order on the viewer. Locked tiles stay unselectable. |
| Solution Architect | Reuse traveling shortlist + `applySelectingPill` + `SelectAllFloat`. Map explore preview → shortlist entry (per-design shop). No new API. |

---

## Platform consistency (required)

1. **Existing patterns?** Album / Explore Select then tap; floater Order.  
2. **Duplicates another feature?** No — not Curate, not a pack.  
3. **Should reuse an existing workflow?** Yes — traveling Selection, not a set-local order dock.  
4. **Naming?** **Select** / **Designs** — never pack.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select visible designs → pile → Order |
| Business rules | OK | Locked / invisible stay out of the pile |
| Workflows | OK | Same pile as Explore / shop |
| Edge cases | OK | Mixed shops in one set stay per-design companyId |
| Permissions | OK | Same as opening each design |
| User states | OK | Sender and recipient; own designs follow existing Selection rules |
| Notifications | N/A | |
| Error handling | OK | Existing availability on Place |
| Scalability | N/A | |
| Mobile interactions | OK | Clear last tiles above floater (existing `pb-28` + select clearance) |
| Accessibility | OK | Named Select control |
| Platform consistency | OK | Match album Select |

---

## Gaps

None Required. Viewer Order / Ask rates stay deferred (Quote only).

---

## Approved scope for this slice

- Header **Select** on `/designs/set` when at least one design is open.  
- Tap photo / mosaic toggles while Selecting; name opens the design. Long-press remains a shortcut.  
- Select all + Clear for **this set’s** visible designs.  
- Traveling floater Order / Ask rates (already on this route).  
- Docs + unit + functional.

## Explicitly deferred / rejected

- Order / Ask rates on PhotoViewer (Quote stays).  
- Treating the set as a Collection.  
- Thread-card long-press as Order (chat menu stays).

## Sign-off

Product + UX + architecture: **Proceed**. Supersedes the 2026-09-30 deferral of Select / Order from the set page.
