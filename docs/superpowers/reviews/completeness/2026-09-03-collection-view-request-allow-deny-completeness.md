# Feature Completeness Review — Collection view request Allow / Deny

**Date:** 2026-09-03  
**Module / ask:** Ask to see **this collection** with in-chat Allow/Deny; Granted on request ≠ Connection; silent Deny; Allow → chat + notif + aggregated Home; owner can list/revoke grants.  
**Anchors:** `docs/features/00-concepts.md`, `collections.md`, `access-and-connections.md`, `chat.md`, `home.md`, `docs/superpowers/specs/2026-09-03-collection-view-request-allow-deny-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Separates pack view from Network connect — matches trust ladder.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack Ask is WhatsApp-like permission for one album. Connect stays Network. Deny stays private. |
| UX Designer | Allow/Deny on owner’s chat card; Meena gets success only. Home one aggregate row. Owner “Granted on request” list. |
| Solution Architect | `CollectionViewGrant` + `CollectionViewRequest`; view gate OR grant; no AccessRequest / Connection on Allow. |

---

## Platform consistency (required)

1. **Existing patterns?** Chat action cards (payment), Home Needs aggregate, kit buttons, Ask gate card on collection.  
2. **Duplicates?** No — Connect access request remains.  
3. **Reuse?** Direct thread to owner; Home Needs; notifications Collection/Request type.  
4. **Naming?** Ask to see this collection · Allow · Deny · Granted on request. No Seller/Buyer.

**Philosophy conflict?** No (extends ladder; does not collapse Connect).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Ask / Allow / Deny / grant / revoke |
| Business rules | OK | Pack-only; no silent Connection |
| Workflows | OK | Chat + Home + notif |
| Edge cases | OK | Idempotent; re-ask; silent deny |
| Permissions | OK | Owner only Allow/Deny/revoke |
| User states | OK | Pending / allowed / denied |
| Notifications | OK | Allow only; aggregate spirit |
| Error handling | OK | Already granted / not owner |
| Scalability | OK | Indexed grants |
| Mobile interactions | OK | In-card CTAs; BM-07 N/A |
| Accessibility | OK | Named Allow/Deny |
| Platform consistency | OK | |

---

## Gaps

None Required. Deferred: owner Home pending Asks; product-level Ask.

---

## Approved scope for this slice

- Schema grant + request; view gate; chat Allow/Deny; Collection Ask UI; Home aggregate; Allow notification; owner granted list + revoke; docs  

## Explicitly deferred / rejected

- Silent Connection on Allow  
- Company-wide catalog grant  
- Product-only Ask  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + manual; e2e optional later)
