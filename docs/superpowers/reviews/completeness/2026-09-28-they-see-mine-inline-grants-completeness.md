# Feature Completeness Review — They see mine: inline see / share

**Date:** 2026-09-28  
**Module / ask:** On **They see mine → Seeing packs**, show what each business can do (see vs share) as on/off, in trader language — not **Change** + “They can see”.  
**Anchors:** `docs/features/access-and-connections.md`, follow-ask grant copy  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Allowed list is the shop’s grant. Same two jobs as Allow: see collections / share collections. Not “view access”. |
| UX Designer | Reuse Asked grant checkboxes (not a new switch kit, not Access sheet). City only under the name. See stays on (this list = they already see). Share taps look ↔ pack. |
| Solution Architect | Existing PATCH `/follows/:id/access`. No owner revoke API — turning see off is deferred. |

---

## Platform consistency (required)

1. **Existing patterns?** FollowAskDecideRow checkboxes + labels.  
2. **Duplicates another feature?** Replaces Change sheet.  
3. **Should reuse an existing workflow?** Same grants as Asked.  
4. **Naming matches the app?** **They can see my collections** / **They can share my collections**.

**Philosophy conflict?** No. Look vs pack unchanged; follower still does not see the grant.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Share toggle patches pack/look |
| Business rules | OK | Pack includes see |
| Workflows | OK | |
| Edge cases | OK | See locked on this list |
| Permissions | OK | Shop-only PATCH |
| User states | OK | look vs pack |
| Notifications | N/A | Other shop not told |
| Error handling | OK | Danger toast |
| Scalability | N/A | |
| Mobile interactions | OK | Taller cards; pb-24 already |
| Accessibility | OK | checkbox + aria-checked; see aria-disabled |
| Platform consistency | OK | Same checks as Asked |

---

## Approved scope for this slice

- Seeing packs cards: city + two grant checks; no Change / Access sheet.
- See locked on; Share toggles pack vs look.
- Docs + unit + follow-ask journey assert checks, not Change.

## Explicitly deferred / rejected

- Owner turning **see** off (revoke) — no shop-side delete API.
- iOS-style switch kit.
- Telling the other shop which grant they have.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
