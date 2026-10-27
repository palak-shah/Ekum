# Feature Completeness Review — owner album draft select + Publish

**Date:** 2026-10-26  
**Module / ask:** On the collection album, owner cannot Select a draft (traveling Selection gate) but can still Order from DesignSheet. How to Publish a draft from the collection page.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed (closes Required gap from owner-album draft members)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Draft on the album is a lifecycle job, not a trade pick. Owner must Select drafts to Draft / Publish them. Buyers never order a draft. Publish from the album uses the same Who sheet as You Designs. |
| UX Designer | Owner album Select may check draft tiles (chip stays). Select ⋯ **Publish** after Draft. Opened draft: ⋯ **Publish**; Order / cart / Share toast **Publish first**. Traveling trade dock still published-only. |
| Solution Architect | Reuse `BulkProductPublishSheet` / `POST /products/:id/post-to-market`. Shortlist rows carry `status` so Order / cart skip unpublished. Traveling gate stays published-only off the owner album. |

---

## Platform consistency (required)

1. **Existing patterns?** You Designs draft dock **Publish N**; album select ⋯ already has Draft; foam Draft chip; `SELECTION_NEEDS_PUBLISHED_TOAST`.  
2. **Duplicates another feature?** No — album was missing the reverse of Draft. You Designs keep their dock. Editor Publish stays.  
3. **Should reuse an existing workflow?** `BulkProductPublishSheet`, not a second Who form.  
4. **Naming matches the app?** Publish / Draft; Publish first.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** No. Trade stays published-only. Owner select on **their** album is also lifecycle.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Select drafts on owner album; Publish from ⋯ and DesignSheet; Order blocked |
| Business rules | OK | Visitors / Explore still cannot pick drafts; archived stays out |
| Workflows | OK | Same Who sheet as You Designs |
| Edge cases | OK | Mixed select: Order skips drafts; Publish only own drafts; mill rows not publishable |
| Permissions | OK | Owner + own company designs |
| User states | OK | Catalog album and General Collection get Publish too |
| Notifications | OK | Existing Publish first / Published N toasts |
| Error handling | OK | Sheet error + toast from BulkProductPublishSheet |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky bar; existing select dock + sheets |
| First glance (BM-11) | OK | Publish sits with Draft in ⋯; trade footer unchanged until tap |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | ⋯ Publish label; toast on blocked Order |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Owner album Select blocked drafts; DesignSheet Order did not

| Field | Content |
|-------|---------|
| Gap | `travelingSelectionToggleGate` blocked drafts on the owner album, so ⋯ Publish had no picks. DesignSheet Order / cart ignored status. |
| Why it matters | Trader cannot finish Draft → Publish on the page they are on, and can sell a quiet design. |
| Impact if ignored | Ask fails; they hunt You Find → Draft; buyers can be ordered a draft from the sheet. |
| Recommendation | Owner album Select includes non-archived members. ⋯ Publish. DesignSheet + dock Order / cart / Share skip unpublished. |
| Priority | Required before implementation |

Closed by this slice.

---

## Approved scope for this slice

- Owner album Select / Select all: non-archived members (drafts included). Visitors unchanged.
- Owned album select ⋯: Bookmark · Draft · **Publish** · Add · Remove · Delete (catalog omits Add; GC omits Remove/Delete).
- DesignSheet owner ⋯ **Publish** on a draft (same Who sheet).
- Order / cart / Share: published only; toast Publish first.
- Shortlist entries may carry `status` so the dock can skip drafts.

## Explicitly deferred / rejected

- Separate lifecycle select vs traveling Selection (one select on the album).
- DesignSheet ⋯ Draft (select ⋯ Draft stays the path).
- Changing Pack Publish so it does not promote own draft members.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
