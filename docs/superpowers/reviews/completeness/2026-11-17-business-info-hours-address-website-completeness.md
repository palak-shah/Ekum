# Feature Completeness Review — Business info hours, address, website

**Date:** 2026-11-17  
**Module / ask:** Optional working hours (same every day + one weekly off), shop address + Map, and website on Business Profile — edit only via existing Edit Profile.  
**Anchors:** `docs/features/company.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Hours / Open now, street + Map, website were deferred in 2026-11-16-showcase-remove-business-info.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders keep one city on identity; shop street is extra. Hours are one open/close + weekly off, not a timetable. Map/website are external, never GPS. |
| UX Designer | Same Business info card (`InfoRow` hairlines). No Open pill, map thumbnail, or extra profile section titles. Edit uses Field / TextInput / Chip. |
| Solution Architect | New nullable `Company` columns. Do not reuse dispatch `Address` or billing `addressLine`. PATCH `/companies/me` only. Stub omits new fields. IST, same-day close only. |

---

## Platform consistency (required)

1. **Existing patterns?** Business info card + Edit Profile fields. Map/website = quiet accent links (Team voice).  
2. **Duplicates another feature?** No — dispatch addresses stay Settings.  
3. **Should reuse an existing workflow?** Yes — `/settings/profile?edit=1`.  
4. **Naming matches the app?** Open now / Closed now, Map, domain as website.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hours + address + website |
| Business rules | OK | Same hours all working days; close after open; IST |
| Workflows | OK | Edit Profile only |
| Edge cases | OK | Hide empty rows; clear hours group; stub omit |
| Permissions | OK | Same PATCH as profile |
| User states | OK | Home own + visitor full profile |
| Notifications | N/A | |
| Error handling | OK | Invalid URL / close before open |
| Scalability | N/A | |
| Mobile interactions | OK | Time inputs; sheet for week; BM-07 dock already on edit |
| First glance (BM-11) | OK | Caption rows, not prototype widgets |
| Units | N/A | |
| Accessibility | OK | Time labels; Map/website are links |
| Platform consistency | OK | |

---

## Gaps

None Required.

IST without a timezone picker is an explicit v1 limit (all Ekum shops India). Overnight hours rejected.

---

## Approved scope for this slice

- Nullable Company hours / address / website; nested PATCH groups.  
- Edit Profile Business information fields.  
- Business info `InfoRow`s + hours week Sheet.  
- Google Maps search URL from formatted address; https website host.

## Explicitly deferred / rejected

- Day-wise / multi-shift / overnight.  
- GPS / map pin / lat-lng.  
- Timezone picker.  
- Completeness nudge, GST, phones, new settings page, catalogue/Showcase.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
