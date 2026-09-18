# Feature Completeness Review — collection same-for-all apply on create

**Date:** 2026-09-18  
**Module / ask:** Same for all must **apply** on create when pack mixes new photos and library designs that already have rates/tags  
**Anchors:** `docs/features/collections.md`, `docs/superpowers/specs/2026-09-18-collection-same-for-all-design.md`  
**Disposition:** Redesign superseded — see `2026-09-18-collection-same-for-all-ux-simplify-completeness.md` (single Done; no library PATCH).

~~Previous two-CTA apply model abandoned.~~


> Completeness keeps Ekum **coherent**. Conflicts with product philosophy → **Reject** or **Redesign**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Locked “library never overwritten” made create Same-for-all a dead form. Traders need an explicit apply, and a way to keep existing design rates when only new photos should inherit. |
| UX Designer | Sheet CTA **Apply to all designs** (primary) + **Only for new photos** (ghost). Why-line plain. Toast: applied count · Diff kept. Diff ring stays for outliers. |
| Solution Architect | Create: PATCH own library products on “all”; pending local update always for photos. “New only” sets shared state + pending, no library PATCH; Diff derives vs shared. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet + primary Button + ghost — same as member sheet Done / Use same as all.  
2. **Duplicates another feature?** No — clarifies existing Same for all.  
3. **Should reuse an existing workflow?** Same sheet; edit mode already PATCHes members.  
4. **Naming matches the app?** Apply / new photos / Diff — trader language.

**Philosophy check:** Fits photos-first + optional shared details. Not a second path for rates.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Two apply modes |
| Business rules | OK | Own products only; Diff skipped on “all” |
| Workflows | OK | Create + edit |
| Edge cases | OK | Empty shared clears; foreign curated not patched |
| Permissions | OK | Own companyId only |
| User states | OK | Empty pack → Done only |
| Notifications | OK | Toast |
| Error handling | OK | ApiError → inline/toast |
| Scalability | N/A | |
| Mobile / BM-07 | OK | Sheet footer |
| Accessibility | OK | Buttons labeled |

---

## Gaps

| ID | Severity | Gap | Disposition |
|----|----------|-----|-------------|
| — | — | — | — |

---

## Disposition

**Proceed** — update features + design spec, then implement.
