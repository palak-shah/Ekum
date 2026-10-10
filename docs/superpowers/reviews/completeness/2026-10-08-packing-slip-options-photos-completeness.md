# Feature Completeness Review — Packing slip options + design photos

**Date:** 2026-10-08  
**Module / ask:** Packing list PDF feels bland (text-only). Seller wants qty in the **order unit**, option to **hide buyer**, option to **show design photos**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, Completeness 2026-10-05-order-line-edit-dispatch-pdf  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Slip is what leaves with the parcel / WhatsApp. Traders scan designs by eye — text table alone looks unfinished. Hiding buyer matters when sharing outward without naming the shop. Qty must match how they ordered (sets / mtr), not a mystery piece count. |
| UX Designer | Before Open/Share: one short options sheet — **Show buyer** · **Show photos** (both on by default). Quiet accent-row toggles, not a settings page. Slip itself: thumb · qty+unit · name · SKU. No dark box chrome. |
| Solution Architect | Keep client-side PDF (no new API). Extend `packingSlip` input with options; async JPEG embed (canvas convert when not JPEG). Fetch fails → row without thumb, never block Open. Shipment qty is already order-unit. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Sheet + accent-border toggle rows; quiet PDF/Share icons on Shipments; packing slip open/share already shipped.  
2. **Duplicates another feature?** No — enriches the same packing PDF.  
3. **Should reuse an existing workflow?** Yes — same Open / Share entry points; options sheet only.  
4. **Naming matches the app?** Packing list · Show buyer · Show photos · Open · Share.

**Philosophy conflict?** No — still seller packing aid; optional buyer line; photos help scan.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Options + photo rows + qty unit |
| Business rules | OK | Qty = shipment qty in order `unit`; no mill names |
| Workflows | OK | Icon → options → Open / Share |
| Edge cases | OK | No image / CORS / PNG → skip thumb |
| Permissions | OK | Same as today (anyone who can open slip) |
| User states | OK | Settled still can open/share |
| Notifications | N/A | |
| Error handling | OK | Toast on generate fail; missing photo silent |
| Scalability | OK | Cap rows; thumbs small |
| Mobile interactions | OK | Sheet BM-07 |
| First glance (BM-11) | OK | Photos make the slip scannable |
| Accessibility | OK | Toggle rows labeled |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Hand-rolled PDF has no images today

| Field | Content |
|-------|---------|
| Gap | Text-only Helvetica table |
| Why it matters | Bland; hard to match bale to design |
| Impact if ignored | Client keeps complaining |
| Recommendation | Embed JPEG XObjects; canvas-encode other formats |
| Priority | Required before implementation |

### G-002 — No place to choose hide buyer / photos

| Field | Content |
|-------|---------|
| Gap | PDF/Share fire immediately |
| Why it matters | Hide buyer and photo choice need a beat |
| Impact if ignored | Wrong slip shared |
| Recommendation | Options sheet before Open/Share |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Options sheet (Show buyer · Show photos, default on) → Open / Share.  
- Qty shown with **order unit** (e.g. `200 mtr`).  
- Optional design thumb per line when fetchable.  
- Hide buyer omits `To: …`.  
- Docs + units + gap matrix.

## Explicitly deferred / rejected

- Server-rendered PDF / letterhead branding  
- Editable qty on the slip  
- Multi-page photo gallery per design  
- Custom logo upload  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
