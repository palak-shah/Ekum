# Feature Completeness Review — Business Profile (Home + Showcase)

**Date:** 2026-11-15  
**Module / ask:** Iteration 2 — Home (`/`) becomes own Business Profile; cover + Business Showcase; Public/Private profile visibility; company/team phone opt-in; rich `company_card` share; profile meaningful with zero collections.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/home.md`, `docs/features/media.md`, `docs/features/access-and-connections.md`, `docs/features/chat.md`, `docs/features/settings.md`  
**Disposition:** **Proceed**

> Completeness keeps Ekum **coherent**. Conflicts with product philosophy → Reject or Redesign. This ask fits identity / Edit / Share concepts; it **redesigns Home** from attention inbox to shop face (Needs coverage already on Chats / Orders / Explore / Network).

**Plan source:** approved Business Profile audit (locked product decisions + UX: three independent photo controls).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Business Profile is **identity + discovery**, not a collection-dependent page. Showcase is owner-promoted shop face (website/photoshoot job), independent of pack audience. Public/Private is profile-level only; collection Follow/audience and Connection/phones stay separate. Cutting Home Needs is OK — domain tabs already own those workflows. |
| UX Designer | One job on Home: own Business Profile. Three photo controls (cover camera, avatar camera, Showcase section manager) — never one undifferentiated picker. Cover tap = view-only gallery. Hide catalogue when nothing accessible. Private stranger = name + avatar + short message. Own `/company/:selfId` → `/`. WA/IG judgment for edit affordances; reuse kit Sheet / PhotoViewer / pills. |
| Solution Architect | Extend `Company` (cover, showcase ≤10, `profileVisibility`, contact phone flags); reuse media URL strings + ownership checks; `GET /companies/:id` returns stub vs full; Explore/Find filter Private; `company_card` MessageType + reference-resolver; contact phones Connections-only. Do not route showcase through `audienceVisibilityOr`. Do not duplicate Team/Network/My Collections. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — `PageHeader`, `Avatar`, `PhotoViewer`, `uploadImage`, Universal Share, shop Follow/Message/⋯, Team membership phone fields, Follow `allowed` for Private full access. Home bottom nav stays.  
2. **Duplicates another feature?** No new My Collections / Network / Team. Showcase ≠ collection media store. Profile cover ≠ collection cover (still no owner-chosen pack cover).  
3. **Should reuse an existing workflow?** Media upload ticket; design picker for promote-to-profile; share sheet; chat card family (`collection_card` / `product_card`).  
4. **Naming?** Business Profile · Cover · Business Showcase · Public / Private. Share = profile card. Request access remains Follow ask for collections (do not rename to “profile access”). Phone = company / team contact, never login OTP.  
5. **Units?** N/A — no rate/qty string changes in this slice.

**Philosophy conflict?** No — if we keep gates separate and do not force collections. **Redesign of Home** is intentional and documented (attention → other tabs).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Home profile; cover/showcase; visibility; phones; company_card; zero-collection |
| Business rules | OK | Locked 1–8 gates; three photo controls; unlink-only remove |
| Workflows | OK | Edit in place; share; Follow opens Private; catalogue conditional |
| Edge cases | OK | See edge list below |
| Permissions | OK | Profile ≠ collection ≠ phone ≠ chat |
| User states | OK | Owner / public viewer / private stranger / approved follower / connected / blocked |
| Notifications | Later | No new notifs required for visibility flip or showcase add |
| Error handling | OK | Upload failures toast; ownership reject on foreign URLs; block 404 |
| Scalability | OK | Showcase max 10; URL strings on Company |
| Mobile interactions | OK | BM-07: sticky Edit dock clearance; bottom nav on Home |
| First glance (BM-11) | OK | One job; cover camera quiet until edit; Showcase section only when editing or has photos |
| Units | N/A | |
| Accessibility | OK | Camera aria-labels; gallery counter via PhotoViewer |
| Platform consistency | OK | |

---

## Edge cases (covered)

- Block → shop 404 (unchanged).  
- Private + not approved follower → stub (name + logo/initials + private message); no cover/showcase/about/shelf/phones.  
- Approved Follower (`Follow.status = allowed`) → full Private profile; phones still need Connection + opt-in.  
- Unfollow → lose full Private access (back to stub); showcase URLs remain on owner.  
- Zero collections/designs → profile complete; **omit** catalogue section (no empty placeholder / force-create).  
- Showcase from design photo → profile access, not pack audience; unfollow pack does not hide showcase.  
- Remove cover/showcase → unlink URL from Company only; do not delete Media blob or Product.  
- Cover edit never mutates showcase; showcase edit never mutates cover.  
- Own `/company/:id` → redirect `/`.  
- Explore/Find: Private omitted for strangers; still listed for approved followers.  
- `company_card`: chat usable; card full vs locked teaser from profile visibility; do not refuse send solely for Private.  
- Login `User.phone` never on profile.  

---

## Gaps

### G-001 — Home attention surface removal

| Field | Content |
|-------|---------|
| Gap | `/` no longer hosts Needs / Followed / Market |
| Why it matters | Docs/tests still describe attention Home |
| Impact if ignored | Orphan e2e and `home.md` drift |
| Recommendation | Rewrite `home.md`; retire or relocate Home attention tests; rely on Chats/Orders/Explore/Network |
| Priority | Required before implementation |

### G-002 — Shop “never shows phone” doc vs product

| Field | Content |
|-------|---------|
| Gap | `company.md` says shop never shows phone even when Connected |
| Why it matters | Iteration 2 shows opted-in phones to Connections |
| Impact if ignored | Docs fight UI |
| Recommendation | Update company + access docs; Contact API stays Connections-only |
| Priority | Required before implementation |

### G-003 — Stub / locked-card copy

| Field | Content |
|-------|---------|
| Gap | Exact private stub and locked `company_card` wording |
| Why it matters | Trader voice |
| Impact if ignored | Awkward English |
| Recommendation | Use plain: **This business is private.** Locked card: name + avatar + same cue. Completeness locks copy; tweak later OK |
| Priority | Required (copy locked here) |

### G-004 — Settings `/settings/profile` vs Home edit

| Field | Content |
|-------|---------|
| Gap | Two edit entry points possible |
| Why it matters | Clutter / dual chrome |
| Impact if ignored | Traders hunt menus |
| Recommendation | Home owns view/edit; `/settings/profile` redirects to `/?edit=1` (or `/` view). Account menu Profile → `/` |
| Priority | Required before implementation |

### G-005 — Showcase UI when empty (viewer)

| Field | Content |
|-------|---------|
| Gap | No showcase section for viewers with zero photos |
| Why it matters | Empty chrome |
| Impact if ignored | Loud empty box |
| Recommendation | Omit Showcase section when empty for viewers; owner edit shows Add photos control |
| Priority | Required |

---

## Approved scope for this slice (Iteration 2)

1. Completeness + feature docs + gap matrix.  
2. Schema/contracts: `coverUrl`, showcase (≤10), `profileVisibility`, `contactPhone` / `showContactPhone`; keep membership `showPhone` / `displayPhone`.  
3. API: public profile stub vs full; PATCH ownership checks; contact phones Connections-only (company first, then team); Explore/Find Private filter; `company_card` send/resolve.  
4. Web: `/` = own Business Profile; remove Needs composer from `/`; own company redirect; three photo controls; cover → PhotoViewer gallery; hide empty catalogue; Public/Private + phone opt-ins; Universal Share → `company_card`.  
5. Tests: unit + `@functional` for gates above; BM-11 trader-eye.

## Explicitly deferred / rejected

- Rebuilding Needs / Followed / Market on any tab  
- Open Graph for bare `/company/:id`  
- Team cap gate on profile PATCH  
- Collection cover revival / openColl chip  
- Duplicate My Collections / Network / Team surfaces  
- Combining cover + showcase into one photo manager (**Reject**)  
- Routing showcase through collection audience (**Reject**)  

## Copy locked (G-003)

- Private stub body: **This business is private.**  
- Locked `company_card` cue: **Private business** (subtitle under name).

## Sign-off

Required gaps closed or deferred in writing: **Yes**  
Ready for implementation / `@functional` journeys: **Yes** (after docs lock for this slice)  
