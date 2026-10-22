# Feature Completeness Review — `<module>`

**Date:** YYYY-MM-DD  
**Module / ask:**  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/<area>.md`  
**Disposition:** Proceed | Redesign | Reject

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | |
| UX Designer | |
| Solution Architect | |

---

## Platform consistency (required)

1. **Existing patterns?** (IA, trust ladder, card language, kit chrome)  
2. **Duplicates another feature?**  
3. **Should reuse an existing workflow?**  
4. **Naming matches the app?** (plain trader language; You / business name; Requests vs Accept; no Seller/Buyer in chat card body)
5. **Units?** If a rate or qty string changes: whose (pack vs design) · which (order / dispatch / Rate per) · surface. Pack on Explore = collection; solo design = that design.

**Philosophy conflict?** No | Yes → disposition must be Reject or Redesign.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | | |
| Business rules | | |
| Workflows | | |
| Edge cases | | |
| Permissions | | |
| User states | | |
| Notifications | | |
| Error handling | | |
| Scalability | | |
| Mobile interactions | | Including: fixed/sticky bars clear last content (BM-07)? |
| First glance (BM-11) | | Phone width: one job is loudest; optional chrome quiet; name+unit not a broken wrap; taps land. Green tests do not skip this. |
| Units (order / dispatch / Rate per) | | N/A unless a ₹ or qty string changes. Pack Explore card = collection; solo design = that design. Whose · which · surface named? Album vs Explore unit match? Blank pack no invented ₹? |
| Accessibility | | |
| Platform consistency | | |

---

## Gaps

For every gap (including platform-consistency conflicts):

### G-001 — `<title>`

| Field | Content |
|-------|---------|
| Gap | |
| Why it matters | |
| Impact if ignored | |
| Recommendation | |
| Priority | Required before implementation · Recommended enhancement · Future improvement · Reject / Redesign |

---

## Approved scope for this slice

What may be implemented / journey-tested after this review (only if disposition is **Proceed**):

- …

## Explicitly deferred / rejected

- …

## Sign-off

Required gaps closed or deferred in writing: Yes / No  
Ready for implementation / `@functional` journeys: Yes / No  
