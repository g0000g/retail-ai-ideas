# R10 — Robot fleet safety & incident governance

> **Tier A — pure software, zero hardware** · **Effort:** S (~1.5 weeks) · **Verdict:** ⭐ differentiator, and nobody else will have it

## Why this exists

Every robot conversation with a retailer ends in the same three questions:

1. **What happens when it hits someone?**
2. **Who decided it should be there at that moment, and can I see why?**
3. **Did it actually save money?**

[I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) already answers (2) and (3) for AI
decisions. R10 extends the same registry to robots and adds (1). It is the robot analogue of the plan that
was called *the differentiator* in the industry folder — for the same reason: **every source lists
governance as the blocker, nobody demos it.**

## Four components, all reusing what I06 built

### 1 · Robot event registry — extend `ai_decision`, don't create a second table

```sql
-- new subject types and event kinds on the EXISTING ai_decision table
subject_type ∈ { …, 'robot', 'robot_task', 'robot_incident' }

feature      = 'robot_task_allocation' | 'robot_route' | 'robot_safety_stop' | …
decision     = the RMF task or the safety action taken
top_factors  = priority policy row · SLA · mutex group · sensor trigger
human_action = APPROVED | REJECTED | OVERRIDDEN | AUTO
outcome      = completed | failed | aborted | incident
```

Every task allocation from [R02](R02-fleet-orchestration-openrmf.md), every escort in
[R05](R05-in-store-service-robot.md), every scan in [R01](R01-shelf-scanning-robot.md) writes one row.
That makes *"why was the robot there?"* answerable six weeks later — which is exactly what an incident
investigation needs.

### 2 · Safety zones as reviewable data

```
robot_zone(
  zone_id, store_id, polygon,
  type ENUM('no_go', 'slow', 'human_priority', 'off_hours_only', 'charging'),
  max_speed, effective_from, effective_to, approved_by
)
```

| Zone type | Where | Rule |
| --- | --- | --- |
| `no_go` | checkout queues, fitting rooms, staff rooms, stairs | robots never enter |
| `slow` | aisle ends, blind corners, promotional displays | speed cap |
| `human_priority` | narrow aisles during trading hours | robot yields and waits |
| `off_hours_only` | the whole sales floor, for [R01](R01-shelf-scanning-robot.md) scan routes | tasks only outside trading hours |
| `charging` | dock area | RMF's dynamic charger assignment operates here |

**Zones are data with an effective date and an approver**, exactly like `labour_rule` in
[V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) and `pricing_rule` in
[I01](../ai-contest-retail-industry/I01-price-markdown-optimization.md). Same pattern, third time — which
is itself a good architectural slide.

### 3 · Incident capture and review

```
robot_incident(
  id, robot_id, fleet, ts, store_id, location,
  type ENUM('emergency_stop','human_contact','collision','stuck','fell',
            'blocked_aisle','battery_stranded','task_abandoned','near_miss'),
  severity, sensor_snapshot_ref, task_id, video_ref?,   ← if the robot has cameras
  human_report, root_cause, action_taken, closed_at
)
```

- **Near-miss is a first-class type.** In safety engineering the near-miss rate predicts the incident rate;
  a system that only records collisions is measuring too late.
- **Auto-capture from the robot's own telemetry** (e-stop triggered, obstacle within X cm, task abandoned)
  rather than waiting for a human report. Humans under-report.
- Incidents feed the Grafana scorecard alongside the AI feature rows from I06.

### 4 · Human-robot interaction rules

Non-negotiables to encode, not to document:

| Rule | Rationale |
| --- | --- |
| **Humans always have right of way** | robots yield, wait, and re-plan; never assert priority |
| **Never autonomously approach a person** who hasn't engaged | applies to [R05](R05-in-store-service-robot.md) |
| **No face recognition, no customer tracking** | same line as [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) and [V10](../ai-contest-retail-vti/V10-face-attendance.md). Robots with cameras are a bigger privacy surface than fixed cameras — the rule gets *stricter*, not looser |
| **Robots do not monitor staff** | declining to build it is the answer, as in V04 |
| **Visible, audible presence** | signage, sound, lights; people must know a robot is operating |
| **One-button stop reachable by any staff member** | and every use of it is an incident row |
| **Off-peak by default** | scanning robots run outside trading hours; SLAM literature is explicit that mainstream methods assume static environments |

## Architecture

```
R01 scan · R02 fleet · R03 dispatch · R05 escort · (R04 picking)
        │ every task allocation, route decision, safety action
        ▼
   ai_decision  (I06's existing table, extended subject types)
        │
        ├─▶ zone evaluator — pre-flight check on every task and route
        │      task violates a no_go / off_hours zone → REJECTED, reason recorded
        │      (the same shape as I06's consistency guard)
        │
        ├─▶ robot_incident — auto-captured from telemetry + human reports
        │
        └─▶ Grafana robot row on the I06 feature scorecard:
               tasks/robot-hour · incident rate · NEAR-MISS rate · e-stops
               zone violations blocked · task success % · cost per task
```

**The zone evaluator is a pre-flight gate, not a monitor.** A task that would route through a no-go zone is
rejected *before* dispatch, with the reason written to the registry — the same fail-closed posture as the
OPA tool gate in [N-12](../ai-contest-retail/12-ai-guardrails-opa.md).

## Build steps

1. **(1 day)** Extend `ai_decision` subject types + a thin client so every robot component writes one line.
   Flyway migration — ⚠ under Spring Boot 4 a missing `spring-boot-flyway` module makes migrations
   **silently skip**.
2. **(2 days)** `robot_zone` model + a map editor in the back-office (draw polygons on the store plan —
   the same floor plan [R06](R06-digital-twin-simulation.md) and RMF's `traffic_editor` already use).
3. **(2 days)** **Zone evaluator** as a pre-flight gate in [R02](R02-fleet-orchestration-openrmf.md)'s
   task path. Fail closed. Unit-test the "zone service unavailable → reject the task" case — that is the
   one test that must exist.
4. **(2 days)** `robot_incident` + auto-capture from telemetry (e-stop, proximity, abandonment) + a review
   workflow with root cause and action taken.
5. **(1 day)** Grafana robot rows on the I06 scorecard.
6. **(1 day)** The **HRI rules document**, published — and the list of things we deliberately did not build
   (staff monitoring, face recognition, customer tracking), with the reason.

## Risks

| Risk | Mitigation |
| --- | --- |
| Treated as paperwork and skipped | It is 8 days and it is the answer to the first question every retailer asks. Frame it as the thing that makes a pilot approvable. |
| Zone data goes stale (store re-merchandised) | Effective dates + a review prompt when [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) publishes a new planogram — the two are naturally coupled |
| Near-misses under-reported | Auto-capture from telemetry, not human reporting |
| Video from robot cameras becomes a surveillance system | **Metadata only leaves the store**, same as [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md). Incident snapshots retained days, not months, and only for incidents. |
| Regulatory expectations differ by market | Zones and rules are data; the schema doesn't change per market. Legal reviews the rows, not the code. |
| Governance without a robot to govern | It rides on [R02](R02-fleet-orchestration-openrmf.md)'s simulated fleet — demonstrable with zero hardware. |

## Demo script (2 minutes — use it as the closer, same as I06)

1. Store map with zones drawn: no-go over the checkout queues, human-priority on the narrow aisle,
   off-hours-only across the sales floor.
2. Schedule a scan task during trading hours → **rejected pre-flight**, with the zone and rule cited.
   Reschedule to 02:00 → accepted.
3. Simulate a near-miss in [R06](R06-digital-twin-simulation.md) → auto-captured as an incident with the
   task ID, so *"why was the robot there?"* is answerable.
4. Grafana: robot rows sitting **alongside the AI feature rows** on the same I06 scorecard — tasks per
   robot-hour, incident rate, near-miss rate, zone violations blocked.
5. The published HRI rules, **including what we deliberately did not build**: no staff monitoring, no face
   recognition, no customer tracking.

Step 5 is the one that lands. It is the same move as V10's *"we did not use face recognition, and here is
the licence and privacy reasoning"* — declining a capability for a documented reason reads as maturity.

## Effort

~9 dev-days, zero hardware. Build it **with** [R02](R02-fleet-orchestration-openrmf.md), not after —
shipping a fleet orchestrator without a safety gate is the wrong order.
