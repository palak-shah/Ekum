# Feature Completeness Review — Cart Repost = Explore RepostSheet

**Date:** 2026-11-24  
**Module / ask:** Cart / You Catalog Repost keeps New vs Existing; both land on shared `RepostSheet` so traders see/change Show rates, Same/Edit/±Margin, Who. Existing = pick pack then Edit with staged adds. No draft-then-navigate publish.  
**Anchors:** `docs/features/saved.md`, `docs/features/explore.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Cart Repost without rates forces a second hop (album publish). New designs into an existing pack often need a margin/Edit pass — merge-only is incomplete. |
| UX Designer | Keep New \| Existing first. New and Existing Edit use the same field stack as Explore. One component language. |
| Solution Architect | Extend `RepostSheet` with `products` target + `pendingProductIds` on Edit. Choose/picker stays thin; strip Curate draft→navigate. |

---

## Platform consistency (required)

1. **Existing patterns?** Explore `RepostSheet`; Curate New\|Existing choose.  
2. **Duplicates?** No — removes second publish dialect.  
3. **Reuse?** Yes — shared RepostSheet.  
4. **Naming?** Repost / Add new / Add to existing.  
5. **Units?** Pack Rate per on Explore Edit; Margin pack+design unchanged.

**Philosophy conflict?** No (aligns cart with Explore publish).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | New + Existing → rates |
| Business rules | OK | Silent expand unchanged |
| Workflows | OK | Choose → sheet → clear cart |
| Edge cases | OK | Name clash Add to it; empty published list |
| Permissions | OK | Curate-check same |
| Notifications | N/A | |
| Mobile / BM-07 | OK | Same sheet chrome |
| First glance BM-11 | OK | Same field stack |
| Units | OK | Pack Edit / Margin |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Explore single-card still no New\|Existing

| Field | Content |
|-------|---------|
| Gap | Explore Repost stays single-source |
| Recommendation | Intentional — out of scope |
| Priority | Future / N/A |

---

## Approved scope

- Completeness + docs.
- `RepostSheet`: `kind: 'products'`; Edit `pendingProductIds`.
- Cart/You/etc.: New → create RepostSheet; Existing → pick → Edit RepostSheet with staged adds.
- Remove Curate create→draft navigate publish.
- Tests + trader-eye note.

## Explicitly deferred

- Explore New\|Existing
- Album ⋯ redesign
- Use whole / Pick designs

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
