# Feature Completeness Review — Curate albums as-is (+ pack Ask later)

**Date:** 2026-09-04  
**Module / ask:** Selection Curate on albums (Order-like resolve); designs as-is; gray locked  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/saved.md`, view-request Allow/Deny  
**Disposition:** Proceed (**Slice A**); Slice B (Ask / grants) Proceed **after** A as separate plan

> Completeness keeps Ekum **coherent**. This review **splits** scope after design review: album Curate uniformity first; pack-permission Ask is a second chat/grant product.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Slice A removes false dead-end and enables as-is pack/design Curate. Slice B Ask is valuable but must not delay the Selection fix. |
| UX Designer | Order-like resolve; gray like Selection; Save draft primary; no Ask CTA until B; no feed icons. |
| Solution Architect | A = resolve + ceiling filter only. B = new grant tables + distinct chat card + revoke — plan like view Ask. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Order album resolve, Selection fade, Curate sheet.  
2. **Duplicates another feature?** No.  
3. **Reuse?** Shared resolve `intent`; B clones view-request with new card type.  
4. **Naming?** Use whole pack / Pick designs / Save draft; avoid Republish in chrome.

**Philosophy conflict?** No.

---

## Checklist scan (Slice A)

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Resolve → Curate; designs-only; gray locked |
| Business rules | OK | Ceiling `allowForward`; continue with allowed |
| Workflows | OK | Selection → Curate → resolve? → sheet |
| Edge cases | OK | Mixed albums+designs; partial locked; zero allowed blocks Continue |
| Permissions | OK | Existing trading / relist |
| User states | OK | Locked vs allowed (Ask pending = B) |
| Notifications | N/A | Slice A |
| Error handling | OK | Expand fail toast |
| Mobile / chrome | OK | Sheets + Selection; BM-07 |
| Accessibility | OK | Reason text on gray rows |

### Slice B (deferred completeness detail)

Full Ask/grant/revoke checklist when planning B; Required: product-level grants, distinct card vs view Ask, Deny silent, owner revoke in same B slice.

---

## Gaps

| Gap | Required / Later | Disposition |
|-----|------------------|-------------|
| Ask supplier + grants + chat | Later (Slice B) | Separate plan after A ships |
| Owner revoke UI | Required **in B** | Not forever TBD |
| Shared resolve component | Prefer in A | `intent: order \| curate` |
| Bulk Ask many locked | Later | Inside B |

---

## Disposition rationale

**Proceed Slice A:** closes album Curate gap with Order uniformity; gray without Ask still honest.  
**Slice B after A:** avoids shipping a bolted-on second Allow/Deny system unfinished.

---

## Follow-ups

1. Spec split locked in `2026-09-04-curate-album-as-is-design.md`.  
2. Update `saved.md` for A now; B when scheduled.  
3. Implement **A only**; writing-plans for A.  
4. Tests A: resolve/expand, gray, zero-allowed, functional album Curate.  
5. Gap matrix: A Spec→Works; B Future/Planned.
