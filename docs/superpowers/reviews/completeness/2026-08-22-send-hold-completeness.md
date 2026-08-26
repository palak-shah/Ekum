# Feature Completeness Review — Send-hold (I handle Phase B)

**Date:** 2026-08-22  
**Module / ask:** Hold linked mill tickets until the handler taps **Send** / **Change**  
**Anchors:** `docs/features/orders.md`, `docs/superpowers/specs/2026-08-21-direct-vs-handle-settings-design.md`, `docs/superpowers/plans/2026-08-21-direct-vs-handle-settings.md` Task 8  
**Disposition:** Proceed

> Finishes the I handle desk already specified. Does not add a Trader role or hard anonymity (Slice D).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ravi must decide what to pass up. Auto-creating mill tickets on place leaks demand and skips Change. |
| UX Designer | Desk verbs only on the buyer↔me ticket: **Send** / **Change**. Related mill rows say **Waiting** until Send. No Manage/Upstream jargon. |
| Solution Architect | `upstreamReleasedAt` null = held. Existing linked orders backfill released. Skip mill thread + `orderCreated` until Send. Seller GET/list 404 while held. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — order detail CTAs, HowManyEach qty lines, kit Sheet.  
2. **Duplicates?** No — this is the missing Send after I handle routing.  
3. **Reuse?** Same linked pair as from-pack / handle forward / Take over.  
4. **Naming?** **Send** · **Change** · **Waiting**. Not release / hold / Manage.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hold on create; Send releases; Change patches then Send |
| Business rules | OK | Soft-hide unchanged; seller never sees held |
| Workflows | OK | Direct + Shared unchanged |
| Edge cases | OK | Multi-mill: one Send releases all held children; existing Phase A tickets stay visible (backfill) |
| Permissions | OK | Only handler (downstream seller) Send; trading already required to handle |
| User states | OK | Waiting vs after Send |
| Notifications | OK | No mill notify until Send |
| Error handling | OK | Double Send → no-op / already sent |
| Scalability | OK | Same hop count as today |
| Mobile interactions | OK | CTAs above nav; Change sheet footer Send |
| Accessibility | OK | Button names Send / Change |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Existing auto-created upstreams

| Field | Content |
|-------|---------|
| Gap | Live I handle tickets already visible to mills |
| Why it matters | Flipping default-null would hide old tickets |
| Recommendation | Backfill `upstreamReleasedAt = createdAt` where `downstreamOrderId` is set |
| Priority | Required before implementation |

### G-002 — Slice D hard block

| Field | Content |
|-------|---------|
| Gap | After Send, ends can still find each other if they search |
| Why it matters | Soft-hide only |
| Recommendation | Out — Slice D |
| Priority | Future improvement |

---

## Approved scope

- Hold new handle / from-pack / Take-over upstreams until Send.
- `POST /orders/:id/send-up` on the downstream ticket; optional qty/rate patches.
- Seller cannot list or GET held tickets.
- Desk CTAs + Waiting on related rows.
- Docs + gap matrix + units.

## Explicitly deferred / rejected

- Hard anonymity (D)  
- Per-mill Send as a second path (one Send releases all held children)  
- Commission  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
