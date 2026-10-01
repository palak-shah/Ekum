# Feature Completeness Review — Bottom-nav ＋ size

**Date:** 2026-10-01  
**Module / ask:** The centred Create ＋ in the bottom nav is too small (same 32px well as Home / Chats). Make it bigger.  
**Anchors:** `docs/features/00-concepts.md` (chrome density), `docs/features/README.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | ＋ is the everyday create door. Matching tab icon size hid it. Density already reserved **48px** for nav ＋ / camera shutter — the live control drifted to 32px. |
| UX Designer | Restore **48×48** circle (not another 32px square). Tab wells stay 32px. Do not float a second bar or grow past 48px (Instagram 56 would thicken the glass and fight BM-07). Glyph scales with the well. |
| Solution Architect | Class on `app-create-fab` only. Main already `pb-28` — 16px taller ＋ still clears. No job change. |

---

## Platform consistency (required)

1. **Existing patterns?** Concepts: Nav ＋ stays 48px while kit Buttons are 40px.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same tap / sheet.  
4. **Naming matches the app?** Create unchanged.

**Philosophy conflict?** No — this restores the locked exception; shrinking ＋ to tab size was the drift.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual only |
| Business rules | N/A | |
| Workflows | OK | |
| Edge cases | OK | |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Bar ~16px taller; `pb-28` still covers last row (BM-07) |
| Accessibility | OK | Larger hit target |
| Platform consistency | OK | 48px as documented |

---

## Gaps

None required.

---

## Approved scope for this slice

- Bottom-nav Create ＋ is **48×48** (`h-12 w-12`), circle, plus glyph ~28px, vertically centred in the nav (not stacked on the 32px icon row).
- Tab icon wells stay 32px.
- Concepts stay “Nav ＋ / camera shutter = 48px” (already true).

## Explicitly deferred / rejected

- Floating / overlapping FAB above the glass.
- 56px+ well.
- Changing Chats / Orders header ＋.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (visual; no new journey)
