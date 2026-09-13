# Feature Completeness Review — Chat attach Camera

**Date:** 2026-09-12  
**Module / ask:** Chat thread ＋ menu: add **Camera** (ContinuousCamera on phone) alongside **Photos** (gallery).  
**Anchors:** `docs/features/chat.md`, `docs/features/media.md`, `docs/superpowers/specs/2026-09-12-chat-attach-camera-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already shoot fabric on phone for designs/orders; chat-only gallery is a missing peer path. Same send semantics as today’s Photos. |
| UX Designer | Peer rows in existing attach sheet; reuse ContinuousCamera (Gallery on chrome). Fix misleading camera icon on Photos. No new chrome invent. |
| Solution Architect | Wire ThreadPage to ContinuousCamera + existing `onPhotoPicked` / upload path; desktop = gallery only. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — ContinuousCamera + gallery like Add designs / Photo order; attach sheet peer rows.  
2. **Duplicates another feature?** No — fills gap in chat attach only.  
3. **Should reuse an existing workflow?** Yes — ContinuousCamera + mediaSession + photo message send.  
4. **Naming matches the app?** Camera / Photos — plain; no Seller/Buyer.

**Philosophy conflict?** No — fewer taps to send what they’re looking at; matches product camera language.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Camera + Photos peers; same photo message |
| Business rules | OK | No new permissions beyond existing media |
| Workflows | OK | Done → upload → send; Cancel abort |
| Edge cases | OK | Unavailable → toast + gallery; empty Done N/A (camera Done disabled until shots) |
| Permissions | OK | Same getUserMedia / soft-release as elsewhere |
| User states | OK | Authed thread only (attach already gated) |
| Notifications | N/A | |
| Error handling | OK | Upload/send errors stay composer danger path |
| Scalability | OK | Cap 30 shots/session |
| Mobile interactions | OK | Fullscreen camera portaled; no sticky clip on thread during camera |
| Accessibility | OK | Existing camera aria; add testids for menu rows |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice.

### G-001 — Playwright cannot drive ContinuousCamera reliably

| Field | Content |
|-------|---------|
| Gap | Full camera capture e2e may be flaky without fake media. |
| Why it matters | Still need attach menu coverage. |
| Impact if ignored | Regressions on menu labels/order undetected. |
| Recommendation | Assert Camera + Photos rows + Photos path; camera capture manual/unit. |
| Priority | Recommended enhancement (document in tests; not block ship) |

---

## Approved scope

- Attach menu: Design → Collection → Camera → Photos → Order  
- Phone Camera → ContinuousCamera → Done → **one** photo message (`metadata.urls`) → existing PhotoAlbum + PhotoViewer  
- Photos → gallery; camera chrome Gallery → same gallery  
- Unavailable → toast + gallery  
- Desktop: Camera/Photos → gallery  
- Distinct icons; chat.md + gap matrix  
- Explicit: no per-shot messages; no second viewer 

## Explicitly deferred

- Composer staging before send  
- Video / PDF  
- Redesign ContinuousCamera  
- Fake-media Playwright camera capture  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — after user signs off written spec  
