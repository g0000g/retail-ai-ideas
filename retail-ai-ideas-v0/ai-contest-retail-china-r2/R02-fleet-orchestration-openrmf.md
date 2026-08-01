# R02 — Cross-brand robot fleet orchestration (Open-RMF)

> **Tier A — pure software, zero hardware** · **Effort:** M (~3.5 weeks) · **Verdict:** ⭐ most defensible idea in this folder

## The market evidence, in three lines

1. **Gartner predicted that by 2026 >40% of enterprises will require cross-brand scheduling capabilities**,
   and the selection criterion for warehouse automation has shifted from *device performance* to
   **system capability** — architecture, implementation experience, business model, global delivery.
2. **The vendors say the same thing.** Geek+'s edge is its **RMS scheduler coordinating 5,000 AMRs in one
   warehouse**, and in Feb 2026 it launched **"Geek+ Brain"**, an embodied-intelligence platform —
   explicitly a shift *"from mobility to operation"*.
3. **Hardware is a commodity.** The top five commercial service robot firms worldwide are all Chinese,
   >half the global market, at **40–60% below Western prices**. Geek+ alone: ~56,000 AMRs, 800+ customers.

→ [00-china-robotics-market.md](00-china-robotics-market.md) §2–3 for sources.

**And the gap:** the research found **no retail-specific Open-RMF integration** — only warehouse and
facility deployments. Retail sites have mixed fleets (a cleaning robot, a delivery robot, a shelf scanner,
maybe an AMR in the stockroom) from **different vendors that do not talk to each other**.

## What we build

Not a robot. Not a WMS. **The layer between the retailer's business systems and a mixed robot fleet.**

```
stock-service · order-service · purchase-service · channel-service
        ▲   business intent: "count aisle 7", "bring pallet X", "deliver to table 12"
        │
   ┌────┴──────────────────────────────────────────────┐
   │  robot-orchestration service  (new, Java/Spring)  │
   │  · task translation: business event → RMF task    │
   │  · priority + SLA policy per task type            │
   │  · outcome → ai_decision registry (I06)           │
   └────┬──────────────────────────────────────────────┘
        │  RMF API
   ┌────┴───────────────────────────────────────────────────────────┐
   │  Open-RMF  (Apache-2.0, Intrinsic + OSRF, OSRA-governed)       │
   │  traffic de-confliction · task allocation · lifts · doors      │
   │  Mutex Groups — virtual locks, "air traffic control principles" │
   │  auto re-localisation after lift transit                        │
   │  dynamic charger / parking assignment                           │
   └────┬───────────────┬───────────────┬───────────────┬───────────┘
        │ fleet adapter │ fleet adapter │ fleet adapter │ fleet adapter
     Geek+ AMR      Pudu service    shelf scanner    Quicktron / HAI
     (vendor API)   (vendor API)    (Nav2 native)    (vendor API)
```

**Two adapter shapes:**
- **Nav2-native robots** → [`open-rmf/free_fleet`](https://github.com/open-rmf/free_fleet) over **zenoh**.
  *"If your robot/fleet exposes native ROS navigation endpoints, it can be readily integrated."*
- **Vendor-API robots** (Geek+, Pudu, Keenon) → write a `full_control` adapter from
  [`fleet_adapter_template`](https://github.com/open-rmf/fleet_adapter_template).

**Copy this reference:** [`Ekumen-OS/andino_rmf`](https://github.com/Ekumen-OS/andino_rmf) — a production
Nav2 ↔ Open-RMF bridge, written up in [Ekumen's 2026 post](https://ekumenlabs.com/blog/posts/nav2-open-rmf-fleet-coordination/).

## The line for the deck

> *"Nav2 gets a single robot from A to B while dodging obstacles. But without a central brain, robots
> become their own biggest obstacles — deadlocks at narrow doorways and traffic jams in busy corridors."*

That is the whole product in one sentence, and it is a quote from the people who built the reference bridge.

## What an adapter must implement

From the Open-RMF template documentation — plan for all three, they are the real work:

1. **Kinematic transformation** — facility map coordinates → the robot's local navigation frame, with
   scale, rotation and offset. `reference_coordinates` needs two sets of `[x,y]` for the same physical
   locations in the RMF (traffic_editor) frame and the robot frame; **minimum 4 matching waypoints recommended.**
2. **Navigation command mapping** — decompose a high-level `PathRequest` into the robot's native actions.
3. **State synchronisation** — continuously publish `FleetState` (battery, mode, position) back to
   Open-RMF **with minimal delay**.

**Versions:** core RMF supports **ROS 2 Humble, Iron, Jazzy** on distro-specific branches; examples target
`ros-jazzy-nav2-bringup`. Binaries are recommended unless you're patching RMF itself.

**Network note that matters in a store:** zenoh configuration lets you **filter and rate-limit by topic**.
Store wifi is not warehouse ethernet — use it.

## Business-task vocabulary (the part that is actually ours)

Open-RMF gives traffic and task allocation. It knows nothing about retail. This mapping is the product:

| Business event | RMF task | Priority policy |
| --- | --- | --- |
| [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) planogram published | scan route over the changed aisles | overnight, low |
| [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) shelf-gap event | targeted re-scan of that bay | within the hour |
| stock-service count discrepancy | verification scan | next off-peak window |
| order picked, ready for the floor | delivery task, stockroom → aisle | during trading, medium |
| spill / incident reported | cleaning robot dispatch | immediate, pre-empts everything |
| charge below threshold | RMF handles it — dynamic charger assignment | automatic |

**Task priority is a business decision, not a robotics one.** Encode it as reviewable data (a
`robot_task_policy` table), the same way labour rules are data in
[V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) and pricing rules are data in
[I01](../ai-contest-retail-industry/I01-price-markdown-optimization.md).

## Build steps

**Phase 1 — simulated fleet, zero hardware (7 days)**
1. ROS 2 Jazzy + Open-RMF binaries + [`rmf_demos`](https://github.com/open-rmf/rmf_demos) running.
2. Store map in `traffic_editor` from a real floor plan; lanes, waypoints, doors.
3. **Two simulated fleets of different "vendors"** (both TurtleBot3 under different `ROS_DOMAIN_ID`, per
   the free_fleet example) so cross-brand de-confliction is demonstrable on day one.

**Phase 2 — the orchestration service (8 days)**
4. `robot-orchestration` Spring Boot service: RMF API client, task translation, the policy table.
5. Kafka consumer for the business events above (schemas registered in **Apicurio**, `mvn verify -Pschema-registry`).
6. Task outcomes → **`ai_decision`** registry per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):
   requested / accepted / completed / failed, with the reason.

**Phase 3 — a real vendor adapter (7 days)**
7. Pick one vendor with an accessible API and write a `full_control` adapter from the template.
   If no vendor is available, write the adapter against a **recorded API trace** and say so — the adapter
   shape is the deliverable, not the specific vendor.

**Phase 4 — operator console + measurement (5 days)**
8. Live floor view: robots, tasks, queues, mutex-group contention, blocked lanes.
9. Metrics: **tasks completed per robot-hour**, deadlock/contention events, task latency by type, robot
   utilisation, and **cross-fleet conflicts avoided** — the last one is the number that justifies the layer.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No vendor gives us API access** | Phases 1–2 are entirely simulated and still demo the value. Phase 3 degrades to a recorded-trace adapter, stated honestly. |
| Vendor lock-in through their own scheduler | That is exactly the problem we're solving; frame it. Some vendors will resist — note it as a commercial, not technical, risk. |
| Open-RMF learning curve | Start from `rmf_demos`, copy `andino_rmf`. Do not write an adapter from scratch first. |
| Store floor is dynamic (customers, trolleys, spills) | Robots run **off-peak**, as Simbe does. Mutex groups for congestion points. SLAM literature is explicit that mainstream methods assume static environments. |
| ROS 2 distro drift | Pin one distro (Jazzy) and one RMF branch; record it in the register |
| Scope creep into building a WMS | Line: **translate business intent into robot tasks, and report outcomes.** Not warehouse task management, not inventory logic, not robot control. |
| Safety | Out of scope here by design → [R10](R10-robot-fleet-governance.md) owns it. Do not ship one without the other. |

## Demo script (3 minutes)

1. Store map in the operator console, two simulated fleets from different "vendors".
2. Publish a planogram change in [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) →
   a scan task appears, is allocated, and a robot moves.
3. Report a spill → the cleaning task **pre-empts** the scan; show the policy row that made that decision.
4. **The money shot:** send two robots from different fleets at the same narrow corridor →
   **Open-RMF's mutex group serialises them** instead of deadlocking. Then turn the mutex group off and
   show the deadlock.
5. Console: tasks per robot-hour, conflicts avoided, task latency by type.
6. Slide: Gartner's >40% cross-brand prediction, next to the fact that **no retail Open-RMF integration
   exists in the public record**.

## Effort

~27 dev-days, **zero hardware**. Phases 1–2 (15 days) are a complete, demoable entry on simulation alone.
