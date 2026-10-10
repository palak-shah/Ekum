# Feature Completeness Review — Collection noun (no “pack” in trader UI)

**Date:** 2026-10-09  
**Module / ask:** Remove the word **pack** from trader-facing copy; the product noun is **collection** / **collections** (tabs already say Collections).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/chat.md`  
**Disposition:** Proceed (philosophy naming lock)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One word everywhere buyers and sellers see: **collection**. “Pack” confused traders next to Collections tabs. |
| UX Designer | Same jobs; only labels/placeholders/toasts/chat card titles. Find → **Find in this collection**. |
| Solution Architect | Copy + docs only. Keep API paths, enums (`accessKind: 'pack'`), `piecesPerPack`, testids, and **order-unit** “packs” (set/dozen/box How many). |

---

## Platform consistency (required)

1. **Existing patterns?** Collections tab / shop already say collection.  
2. **Duplicates?** No.  
3. **Reuse?** Shared constants (`curateCheck`, `seePacksCopy`, API message sources).  
4. **Naming?** **collection** / **collections**. Ask lines: **Ask to see this collection** · **Ask to put in my collection**.

**Philosophy check?** Updates concepts: product noun is collection; internal “pack” may remain in code comments / DB history only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | No behaviour change |
| Business rules | OK | Relist / view-ask unchanged |
| Workflows | OK | |
| Edge cases | OK | Order-unit “packs” stay |
| Permissions | N/A | |
| User states | OK | Chat card titles from API |
| Notifications | OK | Listener titles |
| Error handling | OK | API messages |
| Scalability | N/A | |
| Mobile interactions | N/A | |
| First glance (BM-11) | OK | Find field matches Collections language |
| Accessibility | OK | aria-labels |
| Platform consistency | OK | |

---

## Approved scope

- Replace trader-visible pack/packs with collection/collections in web + API client messages.
- Update feature docs that teach the noun (concepts, collections, chat, home, settings, saved, explore, company as needed).
- Update unit/e2e assertions on those strings.
- **Keep** How many order-unit “packs” (box/bundle sell-as).

## Explicitly deferred

- Renaming code identifiers, routes (`/from-pack`), testids, Prisma, `accessKind: 'pack'`.
- Historical Completeness review titles that say “pack”.
