# Feature Completeness Review — 1:1 title is the shop

**Date:** 2026-09-29  
**Module / ask:** Do not put Media / Team between a 1:1 chat and the other shop. Title = shop. Team is already in ⋯.  
**Anchors:** `docs/features/chat.md`, `2026-09-29-direct-chat-media-team-completeness.md`  
**Disposition:** Proceed (corrects that slice)

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Daily job from a 1:1 is their packs/designs. Media and Team are occasional. Two paths is one too many. |
| UX Designer | Tap name → shop (`fromChat`). Groups still tap name → group page. ⋯ **Team on chat** stays. In-thread search already finds photos/files. |
| Solution Architect | Restore `titleTo` company. Keep `/chats/:id/info` for groups; 1:1 info is unused (no new ⋯ item). |

---

## Platform consistency

1. **Existing patterns?** Title → shop was the 1:1 rule.  
2. **Duplicates?** Yes — title info + ⋯ Team. Drop title info.  
3. **Reuse?** Company profile from chat.  
4. **Naming?** Unchanged.

**Philosophy conflict?** Putting Media/Team in the middle fought fewer taps. This corrects it.

---

## Approved scope

- 1:1 header title → `/company/:id` with `fromChat`.  
- Group title still → `/chats/:id/info`.  
- No extra ⋯ Media (search + ⋯ Team already cover the jobs).

## Sign-off

Required gaps closed: Yes  
Ready: Yes
