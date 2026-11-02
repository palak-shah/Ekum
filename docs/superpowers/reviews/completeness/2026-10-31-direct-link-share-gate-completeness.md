# Feature Completeness Review — Direct Link: Share gate, gray-on-revoke, group at first order

**Date:** 2026-10-31  
**Module / ask:** Direct Link create must require mill shop-wide Share (Pack follow). Without Share, the mill row is **Request share**, not Select. Revoking Share grays existing links (they stay; **Request share** again). Do not open a trio on Save — first Direct order reuses the one group for those exact three shops, any name order.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/settings.md`, `docs/features/orders.md`, `docs/features/chat.md`, `docs/features/explore.md`, Completeness `2026-10-28-direct-link-reuse-group-completeness.md`  
**Disposition:** Redesign (group stamped on Save) and Proceed (Share gate + keep-lanes-gray)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite prior Direct Link completeness files. This Redesign supersedes “stamp trio on Save” from `2026-10-28-direct-link-reuse-group`. Exact-trio identity (`ensureTradeLaneGroup` company set) still holds at first Direct order.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct Link is mill ticket + auto-repost to that buyer. That needs shop-wide **They can share my collections**, not Relist on one album. Request share lands in mill Chats → Requests only. Revoke Share does not delete the link — gray until Share returns. Empty group on Save is noise. |
| UX Designer | Supplier picker: Select only when Pack. Else **Request share** / **Requested**. Gray Direct Link row + the same **Request share**. No extra notice under pickers. Album see/share stay 1:1 cards (already shipped). |
| Solution Architect | Gate `TradeLane.create` on mill `accessKind === pack`. `packAskPending` on Follow for Look→Share upgrade without dropping Look. List `shareActive` from mill Pack. Place / pathForPair I-handle when Share off. Drop `ensureTradeLaneGroup` from create; Place already reuses exact trio. Stop deleting lanes on unfollow/stop. |

---

## Platform consistency (required)

1. **Existing patterns?** ConnectionPicker Select/Selected; Chats Requests follow-ask checkboxes; kit trailing quiet word; gray muted names.  
2. **Duplicates another feature?** No — album **Ask to see this collection** and Relist Ask stay as they are. Direct Link is shop-wide Share only.  
3. **Should reuse an existing workflow?** Yes — `POST /follows`, Requests decide, `ensureTradeLaneGroup` at Place.  
4. **Naming matches the app?** **Request share** · **Requested** · **Wants to share all your collections**. No Seller/Buyer on chat cards.  
5. **Units?** N/A.

**Philosophy conflict?** Yes, with group-on-Save — **Redesign** that slice. Share gate fits the trust ladder (pack before catalog hops).

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Create blocked without Pack; Request share; gray keep |
| Business rules | OK | Four asks: shop See/Share vs album See/Share |
| Workflows | OK | Requests only for mill; trio at first Direct order |
| Edge cases | OK | Look mill not selectable; pending Requested; pack restore same rows |
| Permissions | OK | Mill Pack required; buyer still follows trader |
| User states | OK | Gray vs live list; Requested vs Select |
| Notifications | OK | Trader 1:1 on Share off if thread exists; mill Requests for the ask |
| Error handling | OK | `SHARE_REQUIRED` if Save bypassed |
| Scalability | OK | One trio per three shops |
| Mobile interactions | OK | Sheet picker; BM-07 sheet footer already |
| First glance (BM-11) | OK | Request vs Select is the one job on the mill row |
| Units | N/A | |
| Accessibility | OK | Trailing Request share is a real button; row not nested buttons |
| Platform consistency | OK | Same picker chrome; Requests checkboxes |

---

## Gaps

### G-001 — Create without mill Share; Select on Look mills

| Field | Content |
|-------|---------|
| Gap | Direct Link Save only checks mill follow allowed. Look mills get Select. Auto-repost then skips `FOLLOW_LOOK_ONLY`. |
| Why it matters | Trader thinks the link will hop mill posts. |
| Impact if ignored | Direct Links that never auto-repost; mill never asked for Share. |
| Recommendation | Mill row **Request share** until Pack. API `SHARE_REQUIRED`. |
| Priority | Required before implementation |

Closed in this slice.

### G-002 — Revoke Share deletes Direct Links

| Field | Content |
|-------|---------|
| Gap | `revokeAffectedDirectLinks` deletes lanes and closes the trio. Trader must Save again when Share returns. |
| Why it matters | User must not recreate links for that supplier. |
| Impact if ignored | Lost mill×buyer pairs; empty groups closed while orders live. |
| Recommendation | Keep lanes. Gray + **Request share**. Place I-handle until Pack. |
| Priority | Required before implementation |

Closed in this slice.

### G-003 — Trio opens on Save

| Field | Content |
|-------|---------|
| Gap | Create calls `ensureTradeLaneGroup` so an empty group appears in Chats before any order. |
| Why it matters | Group is for orders among the same three shops. |
| Impact if ignored | Inbox noise; “group at Direct Link create.” |
| Recommendation | Drop group from create. First Direct Place / Order for buyer reuses exact company set (any name order). |
| Priority | Required before implementation · Redesign of 2026-10-28 reuse-group Save stamp |

Closed in this slice.

### G-004 — Look follower cannot ask for Share without dropping See

| Field | Content |
|-------|---------|
| Gap | `POST /follows` on Allowed returns following and does not open a Requests row. |
| Why it matters | Direct Link **Request share** needs mill Requests with Share copy. |
| Impact if ignored | No mill Allow path for Pack upgrade. |
| Recommendation | `packAskPending` while Look stays. listAsks includes those rows. Why-line **Wants to share all your collections**. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + spec lock.  
- Supplier picker: **Request share** / **Requested** / **Select**.  
- `POST /follows/share-ask`; mill Requests share-upgrade copy; Allow → Pack.  
- Create requires mill Pack; no trio on Save.  
- Keep TradeLanes when Share off; `shareActive`; gray row + **Request share**. Place I-handle until Pack.  
- Trader 1:1 system line when mill turns Share off (if 1:1 exists).  
- Unfollow confirm: links go **off**, not removed. Trader × still removes.  
- Units / tests: API + web + `@functional` `@network`.

## Explicitly deferred / rejected

- FOLLOW_LOOK_ONLY auto-repost “fix” (hop skip stays).  
- Rebuilding **Ask to see this collection** / Relist Ask.  
- Per-album Relist unlocking Direct Link.  
- Mill 1:1 message for the Share ask (Requests only).  
- Auto-creating a group without a Direct order.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
