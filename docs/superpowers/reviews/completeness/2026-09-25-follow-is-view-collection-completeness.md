# Feature Completeness Review — See new packs + shop Message

**Date:** 2026-09-25  
**Module / ask:** Follow label → See new packs; drop shop Request; first Message Approve = Connection.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/access-and-connections.md`, `docs/features/chat.md`  
**Disposition:** Redesign (docs first — this review locks the new words and ladder)

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop jobs: See new packs (ask + feed) and Message (first chat). Request access as a shop button is gone. |
| UX Designer | “View collection” rejected — sounds like open now. **See new packs** / Asked / Seeing packs. |
| Solution Architect | Same `POST /follows`. Message = `startDirect`. Accept upserts Connection even with no access row. Block upserts blocked pair. |

---

## Platform consistency (required)

1. **Existing patterns?** Shop action row, pending thread dock.  
2. **Duplicates another feature?** Pack “Ask to see this pack” stays per-album.  
3. **Should reuse an existing workflow?** Follow decide; thread accept/decline.  
4. **Naming matches the app?** Packs, not Follow. Message, not Request.

**Philosophy conflict?** Yes — Connect no longer needs a shop access-request form. **Redesign** documents it; then build.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | After docs |
| Business rules | OK | Order still ≠ Connection |
| Workflows | OK | Network lists unchanged |
| Edge cases | OK | Blocked pair; already chatting → Message opens |
| Permissions | OK | |
| User states | OK | Own shop Edit · Share |
| Notifications | OK | Existing follow / chat pings |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Two shop buttons + Share |
| Accessibility | OK | |
| Platform consistency | OK | |

## Approved scope for this slice

- Shop: See new packs · Message · Share. No Request.
- Approve first Message → mutual Connection.
- Block from chat More without an existing Active connection.

## Explicitly deferred / rejected

- Shipping “View collection” as the shop verb.
- Removing Network.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes (docs in same change)
