# Feature Completeness Review — Look-only blocks Repost; DL mill notify

**Date:** 2026-11-14  
**Module / ask:** Look-only (see, no Repost) must block Curate/Repost even when Connected. Exception: Everyone + allowForward packs stay Repostable without Pack. Direct Link: mill Pack off grays + trader Repost-off ask; buyer unfollow → Place I-handle only (no list gray CTA, no chat).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/orders.md`, `docs/features/settings.md`, `docs/features/explore.md`  
**Disposition:** Redesign

> Completeness keeps Ekum **coherent**. Overturns 2026-09-24 “look-only and not Connected” curate bypass. Forward stays free.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop **They can repost** off means no Curate into the trader’s pack for Followers/Selected — Connection is not a back door. Open **Everyone** + buyers-can-repost stays open to anyone who can see it. Direct Link is the trader’s private path; mill Pack off tells the trader to Request again; buyer unfollow stays quiet. |
| UX Designer | No new chrome for buyer unfollow. Mill Pack off keeps gray Direct Link + **Request repost** + system line **Repost for all collections is off. Request again.** Forward/Share unchanged. |
| Solution Architect | Drop Connection filter in `lookOnlyOwnerIds` / `isLookOnlyFollowBlock`. Skip `FOLLOW_LOOK_ONLY` when source audience is `everyone` and allowForward (or grant). `pathForPair` needs mill Pack **and** buyer Allowed; list `shareActive` stays mill Pack only. Rename revoke line; branch `unfollow` notify. |

---

## Platform consistency (required)

1. **Existing patterns?** Follow access Pack/Look; Direct Link gray + Request repost; mill↔trader system line.  
2. **Duplicates another feature?** No — Forward ≠ Repost.  
3. **Should reuse an existing workflow?** Yes — `notifyShareOff`, `shareActive`, curate-check.  
4. **Naming matches the app?** **Repost** (not Share) on revoke line.  
5. **Units?** N/A.

**Philosophy conflict?** Yes with 2026-09-24 Connection bypass → **Redesign**. No conflict with Forward-free.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Look blocks curate; Everyone+allowForward exception; DL Place dual check |
| Business rules | OK | Connected does not unlock Pack; buyer unfollow silent |
| Workflows | OK | Mill Pack off gray + ask; buyer unfollow I-handle only |
| Edge cases | OK | No thread → skip notify; Everyone without allowForward still blocked |
| Permissions | OK | Pack grant / Everyone open |
| User states | OK | Look vs Pack; shareActive mill-only for list |
| Notifications | OK | Trader mill thread only; no buyer DL chat |
| Error handling | OK | `FOLLOW_LOOK_ONLY` |
| Scalability | OK | Drop connection query on lookOnlyOwnerIds |
| Mobile interactions | OK | Existing DL list / Repost skip |
| First glance (BM-11) | OK | Trader-eye: look+Connected Followers Repost skip |
| Units | N/A | |
| Accessibility | OK | Existing Request repost control |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Connection unlocks look-only Curate

| Field | Content |
|-------|---------|
| Gap | `lookOnlyOwnerIds` filters out Connected shops; Connected + look can publish foreign designs. |
| Why it matters | Client Share/Repost OFF is bypassed. |
| Impact if ignored | Trust broken on They can repost. |
| Recommendation | Always treat allowed look as curate block (except Everyone+allowForward). |
| Priority | Required before implementation |

### G-002 — Everyone + allowForward blocked by look-only

| Field | Content |
|-------|---------|
| Gap | `FOLLOW_LOOK_ONLY` runs before open-pack exception. |
| Why it matters | Public + repost-allowed packs must stay Repostable without Pack. |
| Impact if ignored | Open catalogs wrongly locked. |
| Recommendation | Skip look-only when audience `everyone` and allowForward (or grant); pack audience when `sourceCollectionId`. |
| Priority | Required before implementation |

### G-003 — Unfollow always notifies Share/Repost off

| Field | Content |
|-------|---------|
| Gap | `unfollow` always calls `notifyShareOff`. |
| Why it matters | Buyer unfollow can post mill Repost-off copy in the wrong thread. |
| Impact if ignored | Wrong ask, buyer sees mill language. |
| Recommendation | Notify only on mill Pack → look / Pack revoke path. |
| Priority | Required before implementation |

### G-004 — Buyer unfollow still routes Direct Place

| Field | Content |
|-------|---------|
| Gap | `pathForPair` only checks mill Pack. |
| Why it matters | Buyer must follow trader for Direct eligibility. |
| Impact if ignored | Place Direct when buyer gone. |
| Recommendation | Also require buyer Allowed follow; no list gray CTA. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + feature docs + gap matrix.
- Remove Connection bypass on look-only curate.
- Everyone + allowForward skips `FOLLOW_LOOK_ONLY` (API; Publish Everyone UI later).
- Rename revoke line to **Repost for all collections is off. Request again.**
- `pathForPair`: mill Pack + buyer Allowed; list `shareActive` mill-only.
- Branch unfollow notify; no buyer-unfollow DL chat.
- Tests + trader-eye.

## Explicitly deferred / rejected

- Re-adding Everyone to Publish UI — Later (API exception only).
- Hiding Forward when look-only — Rejected (Forward free).
- Buyer-unfollow Direct Link chat or list gray CTA — Rejected this slice.
- Deleting TradeLane rows on Pack off — Rejected (keep gray).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
