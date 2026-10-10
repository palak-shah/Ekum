# Feature Completeness Review — Repost sheet path-first

**Date:** 2026-10-09  
**Module / ask:** Repost sheet: before name, choose **Add to existing collection** vs **Add new**; existing shows published collections to tap; new = name + **Save** (bookmark icon only — draft, no editor/Publish detour).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/saved.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders hit name-first today and bury “add to existing”. Path-first matches the Cart **Repost** verb: decide *where* first, then fill. |
| UX Designer | One job per step (choose → list or name). Accent-border rows + icons (not pills). Existing list = published only (clear job). New: primary **Publish**; quiet **Save draft**. |
| Solution Architect | Same APIs (`POST /collections`, merge members). Modes `choose` \| `existing` \| `new` in `CurateFromSelectionSheet`. Filter published for existing picker. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet + accent rows; CollectionIcon / PlusIcon; Add new CTA is bookmark **Save** only.  
2. **Duplicates another feature?** No — reorders existing New/Existing paths.  
3. **Should reuse an existing workflow?** Yes — keep merge / ceiling / Ask blocked chrome.  
4. **Naming matches the app?** Repost (not Curate); Add to existing collection · Add new · Save.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Path-first; published list; new → name + Save (bookmark) |
| Business rules | OK | Unique name; merge; ceiling unchanged |
| Workflows | OK | Back to choose from either branch |
| Edge cases | OK | No published → muted + go Add new; name clash → Add to it |
| Permissions | OK | Trading gate unchanged |
| User states | OK | |
| Notifications | N/A | Toast on add-to-existing |
| Error handling | OK | In-sheet InlineNotice |
| Scalability | OK | Search when list long |
| Mobile interactions | OK | Sheet scroll; BM-07 N/A (sheet) |
| First glance (BM-11) | OK | Choose is loudest; name only after Add new |
| Accessibility | OK | Buttons / roles |
| Platform consistency | OK | |

---

## Gaps

None Required.

### G-001 — Drafts in “Add to existing”

| Field | Content |
|-------|---------|
| Gap | Existing path is **published only** this slice |
| Why it matters | Drafts still exist on You |
| Impact if ignored | Add-to-draft via You / name clash |
| Recommendation | Deferred |
| Priority | Future improvement |

---

## Approved scope for this slice

- Repost sheet opens on **choose**: **Add to existing collection** · **Add new** (icon rows).
- Existing → searchable **published** owned collections → tap merges + toast → **You → Collections** (published).
- New → name → quiet **Save** (bookmark) + primary **Publish**; Save → Draft list; Publish → whom sheet → published My Collections. Name-clash **Add to it**.
- Docs `saved.md` + unit coverage for mode / published filter.

## Explicitly deferred / rejected

- Drafts in existing picker
- Renaming internal `curate*` modules

## Verification

- Unit: published filter + sheet mode defaults  
- Trader-eye: Cart → Repost → choose → existing / new  
