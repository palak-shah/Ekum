# Feature Completeness Review — Thread message filters (API)

**Date:** 2026-08-11  
**Module / ask:** Server support for in-thread All / Media / Orders + `q` search (UI already on quality tip; WIP restores API + icons + index)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

## Inventory (restored WIP)

| Piece | Purpose |
|-------|---------|
| `listThreadMessagesQuerySchema` (`view`, `q`) | Contract for scoped list |
| `MessageService.listWhere` + specs | Media = photo/voice; Orders = order_card/rate + legacy system order events; `q` on body / orderLabel |
| Prisma `@@index([threadId, type, createdAt])` + migration | Scoped list performance |
| `SearchIcon` / `ChevronUpIcon` | Unblocks ThreadPage search chrome already committed on quality tip |

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Completes documented Phase 1 search; no new product surface. |
| UX Designer | Scopes stay inside search band (no always-on rail). Icons match existing chrome. |
| Solution Architect | Filter on list API — do not invent a second search index or client-only fake scopes. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — matches chat Completeness 2026-08-11 and ThreadPage query params.  
2. **Duplicates?** No.  
3. **Reuse?** Yes — same `/threads/:id/messages` cursor list.  
4. **Naming?** All / Media / Orders — plain trader language.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Restores API the UI already calls |
| Business rules | OK | Orders scope includes living + legacy system pulses |
| Workflows | OK | Covered by existing `@functional @chat` |
| Edge cases | Recommended | Empty Media/Orders already in journey |
| Permissions | OK | Membership gate unchanged |
| User states | N/A | |
| Notifications | N/A | |
| Error handling | OK | Zod on query |
| Scalability | OK | Composite index |
| Mobile interactions | OK | BM-07 N/A (no new sticky bar) |
| Accessibility | Recommended | Stepper labels (prior chat review) |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Quality tip missing icons / API filters

| Field | Content |
|-------|---------|
| Gap | ThreadPage imported SearchIcon/`view`/`q` while product stash held icons + list filters |
| Why it matters | Search journeys and typecheck depend on this glue |
| Impact if ignored | Broken search / failed web typecheck |
| Recommendation | Land this WIP as Required |
| Priority | Required before implementation |

### G-002 — Metadata-only order search

| Field | Content |
|-------|---------|
| Gap | `q` searches body + orderLabel path only |
| Why it matters | Some traders search by design name on cards |
| Impact if ignored | Misses some hits |
| Recommendation | Future if traders ask |
| Priority | Future improvement |

---

## Approved scope for this slice

- Domain query schema, API filters + unit specs, migration index, Search/ChevronUp icons.  
- No new chat UX beyond what quality tip already ships.

## Explicitly deferred / rejected

- Federated global search → Future (Explore).  
- Slack-like groups → Reject (prior).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (reuse existing chat journey)
