# Feature Completeness Review — stay signed in until Logout

**Date:** 2026-08-31  
**Module / ask:** WhatsApp-style session: OTP only on Logout (or wipe / definitive revoke). Sliding refresh with 10y ceiling.  
**Anchors:** `docs/features/auth.md`, `docs/superpowers/specs/2026-08-31-stay-signed-in-until-logout-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Extends existing bearer refresh model — does not invent cookie sessions or device lists.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders expect stay signed in until Logout. 30d cliff + DB wipe feel like bugs. |
| UX Designer | No new chrome. Reconnecting stays; OTP only after Logout / clear data / full reset. |
| Solution Architect | Access 15m; refresh TTL default 10y + sliding on rotate (new row). Extend `parseDurationMs` with `y`. Client clear paths already narrow — audit only. |

---

## Platform consistency (required)

1. **Existing patterns?** Bearer + single-flight refresh + degraded bootstrap.  
2. **Duplicates?** No — tightens existing stay-signed-in promise.  
3. **Reuse?** TokenService rotate + web tokenRefresh.  
4. **Naming?** Logout on You; plain “stay signed in on this device.”

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | 10y ceiling + sliding + clear rules |
| Business rules | OK | OTP only Logout / wipe / INVALID_TOKEN |
| Workflows | OK | Silent refresh; Logout revokes |
| Edge cases | OK | Full migrate reset still OTP (deferred as acceptable) |
| Permissions | N/A | |
| User states | OK | authenticated / degraded / anonymous |
| Notifications | N/A | |
| Error handling | OK | Network keep tokens |
| Scalability | OK | Same rotation model |
| Mobile interactions | N/A | No sticky chrome |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required.

### G-001 — Full DB reset still logs out

| Field | Content |
|-------|---------|
| Gap | `migrate reset` wipes RefreshToken rows. |
| Why it matters | Local demo after wipe needs OTP. |
| Impact if ignored | Expected “new phone” behaviour. |
| Recommendation | Document in auth.md + demo checklist. |
| Priority | Future improvement (do not block) |

---

## Approved scope for this slice

- Completeness + design Approved  
- `parseDurationMs` + `y`; `JWT_REFRESH_TTL` default `10y`  
- Token rotate sliding covered by unit (new row expiry)  
- Web `setTokens(null)` audit; fix only if gap  
- auth.md, gap matrix, seed note (no truncate RefreshToken)

## Explicitly deferred / rejected

- Device list / force-logout all  
- Biometrics  
- Null `expiresAt`  
- Surviving full DB wipe without OTP  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units primary; functional optional)
