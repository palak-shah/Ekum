# Feature Completeness Review — Design browse layout default

**Date:** 2026-09-12  
**Module / ask:** Personal Feed/Grid default (Ekum default Feed; last choice wins) on album, Saved, My designs.  
**Anchors:** `docs/features/collections.md`, `saved.md`, `catalog.md`, `docs/superpowers/specs/2026-09-12-design-browse-layout-default-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders want Feed by default and memory of last choice; shop stays a stable storefront. |
| UX Designer | Reuse Saved pill language on My designs; album keeps ⋯ Feed/Grid. No You settings (last wins). |
| Solution Architect | Device localStorage per companyId; shared helper; no API. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Feed/Grid already on album + Saved; localStorage prefs like home/explore seen.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same toggle semantics; extend to My designs.  
4. **Naming matches the app?** Feed / Grid — already in product.

**Philosophy conflict?** No — fewer repeated taps; shop deferred intentionally.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Read/write + three surfaces |
| Business rules | OK | Default feed; last wins |
| Workflows | OK | Toggle mid-view; remount uses stored |
| Edge cases | OK | Invalid storage → feed; no companyId → feed no write |
| Permissions | N/A | Layout only |
| User states | OK | Signed-in company key |
| Notifications | N/A | |
| Error handling | OK | Try/catch on storage |
| Scalability | OK | One string key |
| Mobile interactions | OK | No new sticky bar (pill in header) |
| Accessibility | OK | Existing aria-labels |
| Platform consistency | OK | |

---

## Gaps

None Required.

### G-001 — My designs feed tile visual parity

| Field | Content |
|-------|---------|
| Gap | My designs feed row styling must match Saved/album feel without inventing a third card language. |
| Why it matters | Uniformity (ui-quality-bar §4). |
| Recommendation | Mirror Saved feed row proportions (`aspect-[3/4]` / single column) for designs; collections keep collage in feed height similar to Saved. |
| Priority | Required before implementation (match siblings; no one-off) |

---

## Approved scope

- Helper + unit tests; default `feed`  
- Wire album + Saved  
- Add Feed/Grid to My designs (both tabs); persist  
- Docs + gap matrix  
- Company shop unchanged  

## Explicitly deferred

- Company shop layout toggle  
- Cross-device sync  
- Explore layout  

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001 = match Saved, not invent)  
Ready for implementation after user signs off written spec: Yes  
