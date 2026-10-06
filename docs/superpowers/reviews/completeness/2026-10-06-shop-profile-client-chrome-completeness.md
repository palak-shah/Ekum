# Feature Completeness Review — Shop profile client chrome (labels + ⋯)

**Date:** 2026-10-06  
**Module / ask:** Client supplier-profile PDF Goal A — rename Follow CTA to Request Catalog Access / Requested / Has access; Feed·Grid + tab + Chat icons; drop shop helper; header Share → ⋯ with Share · Mute · Block · Remove connection.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/access-and-connections.md`, `docs/features/explore.md`  
**Disposition:** Proceed (naming Redesign; jobs unchanged)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Literacy labels on the same Follow ask. ⋯ surfaces Share + existing Mute/Block/unfollow without a Connected sheet. |
| UX Designer | Icons in front of CTAs/tabs; icon Feed/Grid; destructive Remove connection last. No phone/Report. No emoji tab row. |
| Solution Architect | Reuse Follow POST/DEL, CompanyShareSheet, thread mute PATCH, `POST /connections/company/:id/block`. Find 1:1 from threads list for Mute. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — kit icons, chat ⋯ mute flyout, Network block, foam shop tabs.  
2. **Duplicates another feature?** No — relocates Share; exposes existing jobs on shop.  
3. **Should reuse an existing workflow?** Yes — same Follow / mute / block endpoints.  
4. **Naming matches the app?** **Request Catalog Access** is client wording (Redesign from See new packs). Remove connection = unfollow packs door, not Block.

**Philosophy conflict?** Naming Redesign only — still one Follow ask, no shop Request product, no phone on shop. Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Labels + icons + ⋯ |
| Business rules | OK | Block silent; Remove = cancel follow |
| Workflows | OK | Own shop Share only in ⋯ |
| Edge cases | OK | Mute hidden without 1:1; Remove only when pending/Has access |
| Permissions | OK | Visitor vs own |
| User states | OK | Idle / Requested / Has access |
| Notifications | OK | Mute is chat noise |
| Error handling | OK | Toast / inline on fail |
| Scalability | OK | |
| Mobile interactions | OK | Header menu; BM-07 unchanged |
| First glance (BM-11) | OK | Drop helper; icon tabs glanceable |
| Accessibility | OK | aria-label on ⋯ / layout toggle |
| Platform consistency | OK | |

---

## Gaps

None required before implementation.

---

## Approved scope for this slice

- Idle **Request catalog access** (+ LockIcon); pending **Requested** (+ LockIcon, outline); **Has access** (+ UnlockIcon); Explore feed CTA idle rename.  
- ChatIcon on Message/Chat; remove shop follow hint.  
- CollectionIcon / ProductIcon on Collections · Designs foam pills.  
- Icon-only Feed ↔ Grid toggle.  
- Header **⋯**: Share · Mute/Unmute (when 1:1) · Block · Remove connection (last, when pending/Has access). Own shop: Share only.  
- Docs + gap matrix + units + trader-eye.

## Explicitly deferred / rejected

- Goal B Connected sheet (alerts, My Orders, tags, allow see packs).  
- Hide bottom nav on idle shop.  
- Manufacturer · Est. bio.  
- Phone / Call / Report on shop.  
- Instagram underline tabs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
