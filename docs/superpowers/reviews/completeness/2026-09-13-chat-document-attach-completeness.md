# Feature Completeness Review — Chat Document attach

**Date:** 2026-09-13  
**Module / ask:** Chat ＋ **Document** — curated files (PDF / Word / Excel / CSV / text) + original photos-as-files; multi-pick; Photos/Camera unchanged.  
**Anchors:** `docs/features/chat.md`, attach share on ThreadPage, media upload pipeline  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders share rate lists and invoices as PDF/Excel; sometimes need original photo quality. Document is a clear second path next to Photos. |
| UX Designer | One new Sheet row (same pattern as Photos). File card bubble — not PhotoAlbum. Subtitle surfaces “original photo”. No third menu row. |
| Solution Architect | New `MessageType.document` + `MediaKind.document` for office; images-as-document reuse Image upload then document message. Sequential multi-send. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — attach Sheet rows; media mint → PUT → complete; leave-guard on upload.  
2. **Duplicates another feature?** No — Photos stay album; Document is file send.  
3. **Should reuse an existing workflow?** Yes — photo upload loop pattern; Sheet menu.  
4. **Naming matches the app?** Document / PDF / Word / Excel / Photo — trader language.

**Philosophy conflict?** No — one job per row; Photos vs Document is intentional (WhatsApp-like), not clutter.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Attach → upload → document bubble |
| Business rules | OK | Allowlist; 15MB; no video |
| Workflows | OK | Multi-pick → one message each |
| Edge cases | OK | Invalid types skipped; oversize error |
| Permissions | OK | Thread membership unchanged |
| User states | OK | |
| Notifications | OK | Preview snippet filename/type |
| Error handling | OK | Toast / composer error |
| Scalability | OK | Sequential sends; no count cap |
| Mobile interactions | OK | No sticky chrome beyond existing |
| Accessibility | OK | Filename + type cue |
| Platform consistency | OK | |

---

## Gaps

None Required for v1.

---

## Approved scope

- Document row on ＋ (after Photos); subtitle “PDF, Word, Excel, or original photo”  
- Allowlist: PDF, Word, Excel, CSV/txt, JPEG/PNG/WebP as document  
- Multi-pick uncapped; each file = one `document` message  
- Image via Document = document bubble (not album)  
- Forward document like photo when URL present  
- Docs: chat.md  

## Explicitly deferred

- Video  
- ZIP / PowerPoint / arbitrary MIME  
- In-app PDF/Office reader  
- Document search filter chip  
- Multi-file single message / zip  

## Sign-off

Proceed — implement approved scope only.
