# Feature Completeness Review — kit density

**Date:** 2026-09-26  
**Module / ask:** Tighten everyday kit to match approved Chats density (WhatsApp-like), without a page-by-page rewrite.  
**Anchors:** `docs/features/00-concepts.md` (chrome density), `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already accepted tighter Chats. Same tokens on Button / input / Chip / list square keep the app one language. Do not shrink qty/rate fields or the nav ＋. |
| UX Designer | Default 48px kit was the “everything big” feel. 40px controls + 28px chips match Chats. iOS search/input stays 16px type (no focus-zoom). Design-line thumbs in HowManyEach stay 48px. |
| Solution Architect | Change shared kit + `textInputChromeClass` + `listSquareButtonClass`. Hardcoded album/camera/FAB sizes stay. BM-07: shorter chrome adds clearance; do not cut list padding this slice. |

---

## Platform consistency (required)

1. **Existing patterns?** Same kit, smaller defaults. List chrome remains search + one trailing square.  
2. **Duplicates another feature?** No — this is the Chats density applied to the kit.  
3. **Should reuse an existing workflow?** Yes — no new components.  
4. **Naming matches the app?** No copy change.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual only |
| Business rules | N/A | |
| Workflows | OK | Same taps |
| Edge cases | OK | Callers that already set `min-h-*` keep override |
| Permissions | N/A | |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | One token change |
| Mobile interactions | OK | BM-07: sticky bars get shorter, not taller. Qty fields stay `min-h-10`. iOS 16px type. |
| Accessibility | OK | 40px still tappable; do not go to shop-action 32px for kit Button |
| Platform consistency | OK | Chats `compact` Chip/Search become the default |

---

## Gaps

### G-001 — One-off rows still 48px

| Field | Content |
|-------|---------|
| Gap | Home cards, ConnectionPicker, Saved, album thumbs, Collection editor dashed add, TagsField still hardcode 48px. |
| Why it matters | App will feel mixed until a later list-row pass. |
| Impact if ignored | Kit screens tighten; a few lists stay roomy. |
| Recommendation | Defer. Next slice: shared list row / Avatar 36 on cards. |
| Priority | Future improvement |

### G-002 — Page gaps and Card padding

| Field | Content |
|-------|---------|
| Gap | Many pages still `gap-4` / Card `p-4`. **Explore feed closed 2026-09-26** (user: still roomy after kit tokens). |
| Why it matters | Vertical air remains after controls shrink. |
| Impact if ignored | Home / Saved / pickers stay roomier than Chats. |
| Recommendation | Explore done. Other lists later. |
| Priority | Future improvement (Explore: closed) |

---

## Approved scope for this slice

- Kit `Button` → 40px / 14px type.
- Kit `TextInput` / `SearchInput` → 40px height; keep `text-base` (16px).
- Kit `Chip` default = Chats compact (28px / 12px). `compact` prop stays as alias.
- List squares (`ListSearchRow` / sheet Close) → 40×40.
- Explore search/filter (was hardcoded 46px) and Find in Explore CTA match kit.
- Docs + unit asserts on tokens.

## Explicitly deferred / rejected

- Page `gap-4`, Card padding, PageHeader title size, AppShell dock / ＋.
- HowManyEach / Order builder **design thumbs** (stay 48px).
- Camera shutter, ContinuousCamera thumbs.
- Qty / rate compact fields (already 40px).
- Rewriting every hardcoded `min-h-12` form.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units only; no behaviour change)
