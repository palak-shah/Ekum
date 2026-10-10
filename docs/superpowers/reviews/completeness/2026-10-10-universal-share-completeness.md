# Feature Completeness Review — Universal Share

**Date:** 2026-10-10  
**Module / ask:** One **Share** surface (content-height bottom sheet; scrolls when the list exceeds the viewport) for catalogue (albums/designs) and shop profile: paper-plane trigger, buyer groups + quiet **Create group**, multi-select companies + Find on Ekum, optional message (chat composer without attach), primary **Send** to chats, quieter native **ShareIcon** for outside link.  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/company.md`, `docs/features/broadcast.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed (Redesign of quiet bottom-sheet Share + deferred Create-on-Share)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Share stays “send this pack/design/shop into chats (or outside via link).” Unifying catalog + profile removes two sheets. Optional note rides the card / profile text. Still not Broadcast. |
| UX Designer | Fullscreen one job: pick who → Send. Create group = quiet text. Native share = secondary icon beside Send (never a peer CTA). Paper plane opens in-app Share; iOS upload arrow = OS/outside. |
| Solution Architect | Discriminated payload (`catalog` \| `company`). Reuse ConnectionPicker, buyer-group chips, `postCatalogCardsToThread` + `enquireNote`, share-link + `shareOrCopyInvite`, company `/company/:id` text. Nested `BuyerGroupFormSheet` on quiet Create. |

---

## Platform consistency (required)

1. **Existing patterns?** ConnectionPicker multi + Find on Ekum; Publish-style chips; BuyerGroupFormSheet; chat-like composer chrome without `+`.  
2. **Duplicates another feature?** No — still DMs / 48h / company URL; Compose stays separate.  
3. **Should reuse an existing workflow?** Yes — same chat cards + share-link units + company profile body.  
4. **Naming matches the app?** **Share** · **Buyer groups** · **Create group** · **Send** · native Share icon (no “Share outside” text CTA).

**Philosophy conflict?** No — Redesign keeps one job louder; Create/native stay quiet.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Catalog + company payloads; Create selects new group |
| Business rules | OK | Unique shops; no `POST /broadcasts`; 48h units unchanged |
| Workflows | OK | Paper plane → content-height sheet; Send vs quieter native icon |
| Edge cases | OK | Empty recipients disable Send; native when linkable; exclude self on company share |
| Permissions | OK | Lists when signed in; Create when lists available |
| User states | OK | No connections → Find on Ekum / Explore |
| Notifications | N/A | Chat delivery as today |
| Error handling | OK | In-sheet InlineNotice; AbortError on OS share |
| Scalability | OK | Same N DMs / N share-link posts |
| Mobile interactions | OK | Sticky composer; body clearance (BM-07) |
| First glance (BM-11) | OK | Create = text; native quieter than Send |
| Accessibility | OK | aria-labels Share / Send / Share outside |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Create group from Share (was deferred 2026-10-04)

| Field | Content |
|-------|---------|
| Gap | Traders with no groups re-tap companies. |
| Why it matters | First group often happens at Share time. |
| Impact if ignored | Friction vs Publish. |
| Recommendation | **Ship** as quiet text → `BuyerGroupFormSheet`; on save select group. |
| Priority | Required before implementation |

### G-002 — Loudness of native share / Create

| Field | Content |
|-------|---------|
| Gap | Dual CTAs or Create-as-chip fights pick→Send. |
| Why it matters | BM-11 / one job. |
| Impact if ignored | Confused primary action. |
| Recommendation | Create = quiet text; native = icon-only secondary beside Send. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `UniversalShareSheet` (`catalog` \| `company` payload) kit Sheet (hugs content; one body scroll when past sheet max-h).
- Paper-plane trigger for opening in-app Share; keep `ShareIcon` for native/outside.
- Buyer-group chips + quiet **Create group** text; nested BuyerGroupFormSheet; onSaved selects group.
- ConnectionPicker multi + Find on Ekum + Clear; unique-shop Send.
- Composer without attach; optional note; primary Send; quieter native ShareIcon.
- Catalog: cards + enquireNote; native = 48h share-links (+ note in text).
- Company: profile text DM (+ note); native = `/company/:id`.
- Docs + gap matrix; migrate CatalogShareSheet / CompanyShareSheet call sites.

## Explicitly deferred / rejected

- Group invite `/g/:token`, referrals, Repost, HowMany OS share.
- Changing share-link API / TTL.
- Full ThreadPage composer (voice / mentions / attach).

## Anchors to update

- `docs/features/explore.md`, `collections.md`, `company.md`, `broadcast.md`
- `docs/superpowers/reviews/feature-gap-matrix.md`
