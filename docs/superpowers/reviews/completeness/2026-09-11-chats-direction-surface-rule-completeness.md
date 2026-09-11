# Feature Completeness Review — Chat business-object direction chrome

**Date:** 2026-09-11  
**Module / ask:** One WhatsApp-like rule: direction owns surface; status does not  
**Anchors:** `docs/features/chat.md`, chats visual polish  
**Disposition:** Proceed

> Replaces the prior “surface for both directions” consistency pass. Direction controls fill; status is copy only.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Incoming light / outgoing Ekum teal. Status (Requested, Dispatched, …) never picks a third fill. Quote keeps Accept CTA but obeys direction surfaces. |
| UX Designer | Fixes pale green + white “View order” contrast bug. Same 3+1 IA; chrome only. |
| Solution Architect | Theme from `model.mine` in `ChatTradeCardView` (+ pulse + Thread fallback). Kind soft fills never become card backgrounds. |

## Platform consistency

1. **Existing patterns?** Yes — outgoing text bubbles already solid teal; trade cards align to that messaging rule.  
2. **Duplicates?** No.  
3. **Reuse workflow?** No behaviour change.  
4. **Naming?** Unchanged.  

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Presentation only |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Pulse + legacy fallback follow same rule |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No chrome height change |
| Accessibility | OK | Outgoing links white on teal; incoming teal on light |
| Platform consistency | OK | |

## Gaps

### G-001 — Direction / status mixed chrome

| Field | Content |
|-------|---------|
| Gap | Outgoing cards sometimes light/pale with white links; other chats solid teal |
| Recommendation | Single `mine` theme in shared `ChatTradeCard` |
| Priority | Required before implementation |

## Approved scope

- Incoming: surface + accent rail + dark text + teal links  
- Outgoing: accent fill + white text/links (+ inverted Accept quote for contrast)  
- Pulse + fallback same rule  
- Docs + unit tests + 390×844 capture when seed stack available  

## Explicitly deferred

- Redesigning 3+1 layout  
- Changing payment / photo / plain text (text already teal out)  

## Sign-off

Required gaps closed: Yes · Ready: Yes
