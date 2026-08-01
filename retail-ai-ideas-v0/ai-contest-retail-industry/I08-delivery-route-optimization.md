# I08 — Delivery & route optimization

> **Sources:** InsiderOne (#5 real-time logistics; #9 *route optimization to reduce fuel consumption*) ·
> Innowise (supply chain and logistics) · Emarsys (#7 supply chain) · IBM (logistics cost −10–20% from
> predictive analytics; physical AI in warehouse/supply-chain ops) · NetSuite (supply chain optimization) —
> **5/8 sources**
> **Local model:** OR-Tools VRP (Apache-2.0), CPU · **MiniMax:** no
> **New infra:** none · **GPU:** none · **Effort:** M (~3 weeks) · **Verdict:** medium — high value, high dependency risk

## Pitch

Given tomorrow's orders, today's fleet and each store's/hub's stock, produce the **delivery plan**: which
vehicle carries which orders, in which sequence, leaving when — minimising distance and vehicles used while
meeting time windows.

Then the same engine answers two adjacent questions retail actually asks:
- **Same-day / O2O dispatch** — which store should fulfil this order, and can a rider get there in the window?
- **Inter-store transfer routing** — when [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md)
  says store A is overstocked and store B will stock out, what does the transfer run look like?

## Why it was declined earlier and why it's back

The VTI set explicitly scoped route optimization out. Reasons to reconsider:

- **5 of 8 industry sources name logistics/route optimization** — the second-strongest consensus after
  forecasting/inventory.
- **OR-Tools solves VRP well, on CPU, under Apache-2.0.** The optimisation itself is a solved problem with a
  mature open implementation. This is not a research project.
- We now have the OR-Tools competence anyway from [V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md)
  (CP-SAT rostering) and [I01](I01-price-markdown-optimization.md)/[I03](I03-assortment-space-planogram.md).
  Marginal cost of a third OR-Tools model is much lower than the first.
- `order-service` already has `DeliveryLogController` and `O2oFulfillmentController` — the delivery domain
  is modelled.

## The dependency that decides whether this is viable

**Do we control delivery, or do we hand off to 3PL carriers?**

| Reality | What this plan becomes |
| --- | --- |
| **Own fleet / own riders** (common for grocery, F&B, same-day) | The full VRP plan below. High value. |
| **3PL only** (GHN, GHTK, Viettel Post, Ahamove…) | Routing is *their* problem, not ours. The plan collapses to **carrier selection + dispatch timing + consolidation**, which is still worth ~8 days and still saves money. |
| **Mixed** | Own fleet for same-day/O2O, 3PL for the rest. Build VRP for the own-fleet slice only. |

**Check this in week 1.** Building a VRP for orders you hand to GHN is pure waste. If it's 3PL-only, pivot
to the carrier-selection version and say so — that is a smaller, honest, still-useful plan.

Second dependency: **road distance and travel time**. Straight-line distance produces plans that fall apart
in Ho Chi Minh City traffic. Options: OSRM self-hosted on OpenStreetMap data (BSD-2, free, CPU, and VN OSM
coverage is good), or a commercial matrix API (costs per call, better traffic). **OSRM self-hosted is the
right default** — it fits the local-first posture of the whole VTI set and has no per-call cost.

## Architecture

```
Nightly + intraday (workflow-service flow)
  pgpool STANDBY
    ├─ order-service: orders to deliver, addresses, time windows, COD flags, weight/volume
    ├─ channel-service: stores / hubs as depots
    ├─ stock-service: which depot actually has the items
    ├─ fleet table (NEW, small): vehicles, capacity, shift windows, start/end depot, cost/km
    └─ I07: COD-refusal risk  ·  dim_calendar
                     ▼
  geocoding + address normalisation      ⚠ the real work — see risks
     VN addresses are messy; cache every resolved geocode forever
                     ▼
  OSRM (self-hosted, OpenStreetMap)  →  distance & duration matrix
                     ▼
  OR-Tools VRP  (Apache-2.0, CPU)
     capacitated · time windows · driver shift limits · multi-depot
     objective: minimise (distance cost + vehicle count), penalise late windows
     solve cap 60s; warm-start from yesterday's plan
                     ▼
  ai_delivery_plan(route, vehicle, stop_sequence, eta_per_stop, load)
                     ▼
  dispatcher UI — review, drag to adjust, approve       ← never auto-dispatch v1
                     ▼
  driver app / printed manifest  ·  ETAs feed I07's proactive notifications
                     ▼
  actuals back: realised times per stop → recalibrate service time & travel factors
```

**Service time is as important as travel time.** Ten minutes per stop for a COD handover in an apartment
block versus two minutes for a doorstep drop changes the whole plan. Make service time a **per-stop-type
tunable**, calibrated from actuals — the same "leave the calibration knob" discipline as
[V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md)'s service rate.

## Build steps

1. **(2 days)** **Viability check:** own fleet vs 3PL. Fleet/vehicle data model if own fleet exists.
2. **(4 days)** Address normalisation + geocoding with a permanent cache. Expect this to be the largest
   single chunk of work — Vietnamese addresses are free-text, inconsistent, and often reference landmarks.
   Cache aggressively; a resolved geocode never expires.
3. **(2 days)** OSRM container on OSM Vietnam extract → distance/duration matrix service.
4. **(5 days)** OR-Tools VRP: capacitated, time windows, driver shifts, multi-depot. Baselines first —
   nearest-neighbour and "yesterday's manual plan". **Nothing ships unless it beats the manual plan.**
5. **(3 days)** Dispatcher UI: map, routes, drag-to-adjust, re-solve, approve. Manifest export.
6. **(2 days)** Actuals feedback: realised stop times → service-time and travel-factor calibration.
7. **(2 days)** ETA feed into [I07](I07-proactive-service-orders.md) so customers get real windows.
8. **(2 days)** Measurement via [I06](I06-ai-governance-measurement.md): km per order, orders per vehicle,
   on-time rate, cost per delivery — holdout by day or by zone.

**If 3PL-only**, replace steps 3–5 with: carrier selection (cost × SLA × historical on-time by zone),
dispatch-time optimisation, and shipment consolidation. ~8 days total.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No own fleet → the whole plan is misdirected** | Week-1 check with a defined pivot to carrier selection |
| **Vietnamese address quality / geocoding** | The dominant cost. Normalise, cache permanently, allow manual pin-drop correction that persists per address. Report geocode success rate honestly — it caps everything downstream. |
| Traffic reality vs OSRM's static profile | Calibrate travel factors by time-of-day and zone from actuals. Motorbike vs truck profiles differ enormously in HCMC — model them separately. |
| Drivers ignore the plan | Dispatcher approves, drivers get a simple sequence; measure plan adherence as a KPI. A plan nobody follows is a spreadsheet. |
| Plan brittle to intraday change (new order, failed delivery) | Re-solve is cheap (60s). Support intraday re-optimisation for unassigned stops without reshuffling routes already in progress. |
| Solve time explodes | Solve **per depot per day**, cap at 60s, warm-start. That's how the problem decomposes naturally. |
| Scope creep into a TMS | Line: plan, sequence, ETA, manifest. No carrier contracts, no freight audit, no proof-of-delivery app. |
| Depends on I07 for ETA value | Both are cheap on the other's back; sequence I07 first if only one is built |

## Demo script (2.5 minutes)

1. Tomorrow's 180 orders on a map, unassigned.
2. Solve → 7 routes instead of the manual plan's 9; total distance −18%; every time window met.
3. Open one route: stop sequence, ETA per stop, load. Point at a stop the solver put late because it's a
   COD flagged high-refusal-risk by [I07](I07-proactive-service-orders.md) — confirmed before dispatch.
4. Add an urgent order intraday → re-solve for unassigned stops only, routes in progress untouched.
5. ETAs flow into customer notifications ([I07](I07-proactive-service-orders.md)).
6. Measurement slide: km per order and orders per vehicle, planned vs the manual baseline, with the honest
   note that geocode success was 94% and the remaining 6% were hand-pinned.

## Effort

~22 dev-days for the own-fleet version, ~8 for the 3PL carrier-selection version. **Do the week-1 viability
check before committing** — this is the plan in the three folders most likely to be aimed at a problem we
don't have.
