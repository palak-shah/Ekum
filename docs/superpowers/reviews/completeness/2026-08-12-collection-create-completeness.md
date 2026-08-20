# Feature Completeness Review — Collection create (Slice 1)

**Date:** 2026-08-12  
**Module / ask:** WhatsApp-style photos-first New collection (cover tag, light designs, Draft/Publish/Share)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, design spec `2026-08-12-collection-create-whatsapp-style-design.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sellers need low-effort album create; photos → draft designs fits album model. Buyer groups / endsAt deferred. |
| UX Designer | Cover tag beats separate cover upload; Draft/Publish/Share matches existing lifecycle language. |
| Solution Architect | Reuse media upload, POST products, PUT membership, publish sheet, broadcast share — no second photo store. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Catalog collections, camera/gallery sheet, publish audience.  
2. **Duplicates?** No Media tab; Share via broadcast card path.  
3. **Reuse?** Same publish sheet as edit mode.  
4. **Naming?** Collection / designs / Cover — not posts or chat Groups.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap → in scope | Create wizard |
| Business rules | OK | Photos → Product rows |
| Workflows | OK | Draft / Publish / Share |
| Edge cases | OK | Draft shell without members |
| Permissions | OK | Publish consent unchanged |
| Mobile | OK | BM-07 sticky CTAs |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Seller create photos-first unproven

| Field | Content |
|-------|---------|
| Gap | Current create is name/cover-first |
| Priority | Required before implementation |

### G-002 — Buyer groups / no-forward

| Field | Content |
|-------|---------|
| Gap | Frequent audience + exclusive forward |
| Priority | Future (Slice 2) |

### G-003 — Collection endsAt

| Field | Content |
|-------|---------|
| Gap | Evergreen vs season end |
| Priority | Future (Slice 3) |

### G-004 — Media tab / chat Groups

| Field | Content |
|-------|---------|
| Priority | Reject |

---

## Approved scope (Slice 1)

Photos-first create, library optional, cover tag, auto names, same-for-all light fields, Save draft / Publish / Share (broadcast after publish-if-needed).

## Sign-off

Required gaps closed or deferred: Yes  
Ready for implementation: Yes
