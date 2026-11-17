# Feature Completeness Review — Business Network Experience (Iteration 4A)

**Date:** 2026-11-17  
**Module / ask:** Document and lock Follow vs Connection + Network terminology (Following / Followers / Connections). Docs only — no UI/API/permission/schema changes.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/company.md`  
**Disposition:** Proceed (documentation / terminology lock)

> Completeness keeps Ekum coherent. Do **not** merge Follow and Connection. UI string renames are a later iteration (TG-01…05).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Textile traders need two clear doors: see collections (Follow) vs communicate (Connection). Asymmetry is intentional. |
| UX Designer | Hub labels should read Following / Followers / Connections with short page subtitles. Profile keeps one **Network** pill. |
| Solution Architect | Routes `/network/following|followers|connections` and APIs stay. Docs lock target language; shipped UI still uses I see theirs / They see mine until UI iter. |

---

## Locked relationship model

| Concept | Job |
|---------|-----|
| **Follow** | **Action** + relationship kind — whose collections/updates a company can see (`look` / `pack`). Shop CTA **Follow** → owner Accept. Do not replace with “Request access.” |
| **Following** | **Resulting state** (shop filled CTA) **and** Network destination (outbound list). |
| **Connection** | Businesses you can communicate with (chat / opted-in phones / Place prefer). |

**Asymmetry (required):**

1. Follow approval → Follow **+** Connection.  
2. Connect approval → Connection **only** (no Follow).  
3. Message acceptance → Connection **only** (no Follow).  
4. Unfollow / **Stop seeing** → removes Follow; **does not** remove Connection.  
5. Connection alone → **no** collections / private-profile unlock.  
6. **Block** → separate op (wipes Follows both ways; Unblock restores Connection only).

---

## Locked Network terminology

Profile: one compact **Network** entry → `/network`.

| Destination | Locked label | Page subtitle (destination only) | Route |
|-------------|--------------|----------------------------------|-------|
| Following | **Following** | Businesses you see updates from. | `/network/following` |
| Followers | **Followers** | Businesses who can see your updates. | `/network/followers` |
| Connections | **Connections** | Businesses you can communicate with. | `/network/connections` |

Hub also: Direct links · Buyer groups · Invites. No follower counts/rankings.

### Action glossary (locked intent)

| Label | Means | API |
|-------|-------|-----|
| **Follow** (shop / Explore) | Action — ask Follow | `POST /follows` |
| **Following** | State (shop filled) + Network destination | `GET /follows/following` |
| **Ask to connect** (Find / connect) | Ask Connection | `POST /access-requests` |
| **Ask to repost** | Follow pack upgrade | `POST /follows/share-ask` |
| **Stop seeing** | Remove Follow | `DELETE /follows` |
| **Remove connection** | End Connection where supported | Connection ops — **not** unfollow |
| **Block** | Silent block | Existing |

Do **not** use Unfollow and Remove connection interchangeably.

**TG-02 location:** Visitor shop ⋯ only ([`CompanyOverflowMenu.tsx`](apps/web/src/features/company/CompanyOverflowMenu.tsx) → `onRemove` → unfollow). Not on Connections list (that uses **Block**).

---

## Platform consistency

1. **Existing patterns?** Network hub + destination lists; shop Follow / Following (shipped legacy: Request access / Has access); Chats Requests for Connect.  
2. **Duplicates?** No merge of Follow/Connection.  
3. **Reuse?** Routes and APIs unchanged.  
4. **Naming?** Locked terms above; TG-* for shipped UI lag.  
5. **Units?** N/A.

**Philosophy conflict?** No — clarifies existing trust ladder.

---

## Verified gaps (UI still old — do not “fix” by docs alone)

| ID | Class | Actual today | Locked docs |
|----|-------|--------------|-------------|
| TG-01 | UX debt | Hub/pages: **I see theirs** / **They see mine** (`networkSeeLabels.ts`); specs ban Following/Followers | Following / Followers |
| TG-02 | UX/label bug | Shop ⋯ **Remove connection** (only use) → unfollow | **Stop seeing** / cancel ask |
| TG-03 | UX debt | Find **Request access** = Connect; DL **Request repost** | **Ask to connect**; **Ask to repost** |
| TG-04 | UX debt | Shop primary Request access / Has access; leftover “Follow ask” copy | **Follow** / **Following** |
| TG-05 | Low | Hub Back → `/more`; Home opens Network | Document entry paths |

Screenshots (390×844, audit session): Network hub, I see theirs, They see mine, Connections, shop Has access + Chat (Cursor screenshots temp).

---

## Scenario trace (docs vs implementation)

| # | Scenario | Route / API | Notes |
|---|----------|-------------|-------|
| 1–2 | Buyer/Trader Follow | Shop → `POST /follows` | Pending until Accept; state becomes Following |
| 3–4 | Owner Accept/Reject | Followers Asked / Chats Requests → `POST /follows/decide` | Accept ⇒ Follow + Connection |
| 5 | Become Connected | Follow Allow **or** access Approve **or** Message Accept | Connect/Message ≠ Follow |
| 6 | Open shop from Network | Row → `/company/:id` | |
| 7 | Message from profile | `POST /threads/direct` | Chat when connected/hasChat |
| 8 | Stop Follow | Stop seeing / unfollow DELETE | Connection may remain |
| 9 | Private stranger | Stub until Allowed Follow | |
| 10 | Block | Connection block + wipe Follows | Unblock ≠ restore look/pack |

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Docs lock; behavior unchanged |
| Business rules | OK | Asymmetry explicit |
| Workflows | OK | |
| Edge cases | OK | TG-* |
| Permissions | N/A | No change |
| First glance (BM-11) | N/A | Docs iter |
| Platform consistency | OK | |

---

## Approved scope (this slice)

- Completeness audit + feature docs + gap matrix for TG-01…05.  
- Terminology lock in docs only.

## Explicitly deferred / rejected

- UI rename Following/Followers; shop ⋯ label fix; Find Ask to connect; Block functional fixes; confirm on cancel Has access; counts; DL redesign; schema/API.

## Sign-off

Required gaps closed or deferred in writing: Yes (TG-* deferred to UI iter)  
Ready for documentation ship: Yes  
Ready for UI implementation: No — wait for next iteration approval  
