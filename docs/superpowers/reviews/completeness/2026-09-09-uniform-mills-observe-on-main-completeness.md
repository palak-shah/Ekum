# Feature Completeness Review — Uniform Mills observe on main

**Date:** 2026-09-09  
**Module / ask:** Supersede D12 N-Direct flip. Flip **Mills** stays on main + linked lots; trader observes; scales to many mills.  
**Anchors:** `docs/features/orders.md`, journey matrix D12/E4, unified main+lots  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Me = operate; Mills = observe on same main. Default Me+Off. |
| UX Designer | Same desk; Mills + quiet names; Find sub → main. |
| Solution Architect | Flip Mills = upsert TradeLane `ticket=mill` per hop; return parent `get`. No cancel/create Direct. Buyer mill desks via existing visibility. |

---

## Observe rules (locked this slice)

| Topic | Rule |
|-------|------|
| Structure | Main + ups unchanged |
| Buyer | ticket mill ⇒ mill cards visible on main |
| Trader Me | Send on mill cards; Send quote on face after mill rates |
| Trader Mills | **Observe:** Send + Send quote under **Take over** only |
| Flip back | Mills → Me stamps lanes `ticket=me` |
| Find | Sub-order → open main |

## Platform consistency

OK — one desk language.

## Approved scope

- API `flipTicket` Manage→Mill: stamp lanes only  
- Units + e2e D12 rewrite  
- Docs: D12 Pass (uniform); retire N-Direct interim  

## Explicitly deferred

- Auto-release mills without Send when Mills  
- Hiding Send behind Take over when Mills  
- Your paths “default all pairs Direct” bulk UI polish  

## Sign-off

Required gaps closed: Yes  
Ready for implementation: Yes  
