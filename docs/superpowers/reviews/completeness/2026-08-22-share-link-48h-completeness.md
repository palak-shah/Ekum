# Feature Completeness Review — 48h share link

**Date:** 2026-08-22  
**Module / ask:** Deep link to one design or collection. Guest sees cover + name; join to open the real pack.  
**Anchors:** `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/referrals.md`  
**Disposition:** Proceed

> Door in. Not a guest shop. **Everyone** (live): look-only designs. Closed: cover + name + Request access. After login, same Order / Request / 404 as in-app.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | WhatsApp is how traders send a pack. Strangers must not Order a private album. They should see what they were sent before OTP. |
| UX Designer | Guest `/s/:token` public. Everyone: look-only grid. Closed: card + Request access. Share chats: pinned then recent. |
| Solution Architect | `/s/:token` outside RequireAuth. Public GET: `open` + `designs` only when Everyone + live. After OTP, existing viewer + audience. |

---

## Platform consistency (required)

1. **Existing patterns?** CatalogShareSheet; referral share text; invite-return; kit card + primary CTA.  
2. **Duplicates?** Chat share stays. This is off-app.  
3. **Reuse?** OTP, stash `/s/`, visibility service. No new public catalog dump.  
4. **Naming?** **Share a link** · **Open on Ekum**. Not “public pack” / shop.

**Philosophy conflict?** No — token shows the card, not a shop and not a post-login bypass.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Create link + public teaser + auth skip + redirect |
| Business rules | OK | Same audience after login |
| Workflows | OK | Everyone: look-only → Open on Ekum → OTP → pack. Closed: card → Request access → OTP → Request/Follow. Authed: skip |
| Edge cases | OK | Expired / blocked / multi-select |
| Permissions | OK | Sharer must be allowed to share that card |
| User states | OK | Guest teaser vs authed skip |
| Notifications | N/A | |
| Error handling | OK | Expired on `/s/` without login |
| Scalability | OK | Token rows; teaser uses existing public view |
| Mobile interactions | OK | One CTA; no sticky bar over a grid |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Multi-select Share

| Field | Content |
|-------|---------|
| Gap | Sheet can share several cards into chat |
| Recommendation | 48h link only when **one** album or **one** design is on the sheet |
| Priority | Required |

### G-002 — Guest browse

| Field | Content |
|-------|---------|
| Gap | Login wall before any photo felt like a dead link. Full album on a closed pack leaks private designs. |
| Recommendation | **Redesign (closed):** Everyone + live → look-only designs. Otherwise cover + name + Request access. No rates / Select / Order until login. |
| Priority | Required |

### G-003 — Auto-connect

| Field | Content |
|-------|---------|
| Gap | Link could auto-connect |
| Recommendation | Out — Request if not in audience |
| Priority | Reject / Redesign |

---

## Approved scope

- Share sheet quiet text under chats: **Share a link · 48 hours** when exactly one collection or product.  
- Guest `/s/:token` public: Everyone look-only grid; closed cover + name + **Request access**. Logged-in: skip to real viewer.  
- After join: same Order / Request / Follow as in-app. Blocked / expired → 404.  
- Share sheet: pinned then recent.

## Explicitly deferred / rejected

- Guest shop (Order / rates / Select without an account), auto-connect, “anyone can order a private pack”  
- Design grid on Connections / Followers / Selected links  
- Multi-item 48h links  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
