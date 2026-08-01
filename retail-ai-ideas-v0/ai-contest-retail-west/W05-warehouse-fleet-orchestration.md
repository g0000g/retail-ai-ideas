# W05 — Warehouse fleet orchestration, Western vendors, back-of-house first

> **Driver:** *"back-of-house automates before front-of-house"* · **Effort:** M (~3 weeks) · **Verdict:** high — [R02](../ai-contest-retail-china-r2/R02-fleet-orchestration-openrmf.md) aimed where the money actually is

## Why back-of-house, and why now

| Fact | Source |
| --- | --- |
| **Amazon: ≥€10 billion ($11.4B)** to modernise its **European** fulfilment network with robots — Proteus (autonomous), STARK (heavy bins), Vulcan (tactile sensing) | [00-west-market-research.md](00-west-market-research.md) §1 |
| **Symbotic ↔ Walmart**: 85% of Symbotic FY2025 revenue from Walmart; automate **all US regional DCs by 2034**; Jan 2026 Symbotic bought Walmart's robotics division ($200M) while Walmart invested **$520M**; co-developing **store-level micro-fulfilment** | same |
| Symbotic's pitch: **$50M module → $250M savings over 25 years** | same |
| Combined deploy base — Agility **Digit**, Boston Dynamics **Stretch**, **AutoStore**, **Locus**, **Geek+**, **Symbotic** — exceeds **85,000 units** | same |
| Market structure: Amazon dominates on scale but runs a **closed ecosystem**; **Locus, Geek+, GreyOrange** compete on deployment speed and flexibility | same |
| **The 2026 capital flows confirm** warehouses and DCs are where automation pencils out; **customer-facing store robotics remain far more fragile** | Bossa Nova analysis, §2 |

**Two consequences for us:**
1. **Amazon's stack is closed** — not purchasable. Symbotic is effectively Walmart's. What a mid-size
   retailer can actually buy is **Locus, Geek+, AutoStore, GreyOrange** — and they do not talk to each other.
2. **The demand for cross-brand orchestration is the same as in China**, but the vendor list is different
   and the deployment is a DC rather than a store floor.

## Same layer as R02, different scope

[`R02`](../ai-contest-retail-china-r2/R02-fleet-orchestration-openrmf.md) built the orchestration layer over
Open-RMF. **W05 is that layer, scoped to back-of-house, with Western vendors.** Do not rebuild it — reuse it.

| | R02 (China round) | **W05 (this)** |
| --- | --- | --- |
| Environment | store floor + stockroom | **DC / micro-fulfilment centre** |
| Vendors | Geek+, Quicktron, HAI, Pudu, Keenon | **Locus, Geek+, AutoStore, GreyOrange**, plus goods-to-person |
| People present | **customers** — the hard constraint | **trained staff only** — a much easier safety and UX problem |
| Task sources | planogram, shelf gaps, spills | **order waves, replenishment, putaway, cycle counts** |
| The win | cross-brand de-confliction | **cross-brand de-confliction + work release** |

**Why back-of-house is genuinely easier, not just more valuable:** no customer discomfort (the reason
Bossa Nova died), no aisle-clearance constraint, no trading-hours restriction, staff are trained and can
be told to yield, and the floor plan is designed rather than merchandised.

## What is ours vs the vendor's — the same line as R04

| Layer | Owner |
| --- | --- |
| Robot hardware, charging, maintenance | vendor |
| Fleet scheduling **inside one vendor's fleet** | **vendor's own scheduler** — do not compete with it |
| **Cross-vendor traffic and task allocation** | **ours** — Open-RMF |
| **Which work to release, when, in what wave** | **ours** — and this is where the value is |
| **Slotting** (where each SKU lives) | **ours** — [R04](../ai-contest-retail-china-r2/R04-front-warehouse-picking.md)'s optimiser, unchanged |
| Business intent → robot task | **ours** |

## Architecture

```
order-service (waves) · purchase-service (putaway) · stock-service (cycle counts, replenishment)
        ▼
  WORK RELEASE POLICY   ← the algorithm that matters
     batch by pick-path overlap · deadline (carrier cut-off) · zone · temperature
     release wave → orchestration
        ▼
  robot-orchestration service  (R02's, unchanged)
     task translation · priority + SLA policy as data · zone gate (R10) · outcome → ai_decision (I06)
        ▼
  Open-RMF (Apache-2.0)
     cross-vendor traffic de-confliction · mutex groups at congestion points ·
     lifts and doors · dynamic charger assignment
        ▼
  fleet adapters   (free_fleet for Nav2-native · full_control template for vendor APIs)
        ▼
  Locus  ·  Geek+  ·  AutoStore  ·  GreyOrange  ·  goods-to-person carriers
        ▼
  actuals → recalibrate pick time per SKU / zone / station
```

**Everything above the adapters already exists** in R02 and R04. W05's new content is:
the **Western vendor adapter set**, the **DC work-release policy**, and the **carrier cut-off** as the
deadline that drives everything.

## Carrier cut-off is the Western deadline

In China's instant retail the clock was a **30-minute promise**. In a Western DC it is the
**carrier collection cut-off** — miss it and the order ships a day late regardless of how fast the robots
moved. So:

- work release is scheduled **backwards from cut-off**, not forwards from order receipt
- the SLA per task type is derived from the cut-off, not set by hand
- the measured KPI is **orders released before cut-off**, and only then cost per unit picked

That single reframing is what makes the plan a warehouse plan rather than a robotics plan.

## Build steps

1. **(2 days)** **Viability gate**: is there a DC or micro-fulfilment centre, and does it have (or plan)
   robots from more than one vendor? If single-vendor, the orchestration argument weakens — the honest
   answer is then *"use the vendor's scheduler"*, and the plan reduces to work release + slotting, which is
   still worth ~2 weeks.
2. **(2 days)** Reuse R02's orchestration service; add DC task types (wave release, putaway, cycle count,
   replenishment).
3. **(4 days)** **Work-release policy**: backwards from carrier cut-off, batched by pick-path overlap,
   zone and temperature. Simulate against replayed real order streams
   ([R06](../ai-contest-retail-china-r2/R06-digital-twin-simulation.md)'s harness).
4. **(3 days)** Slotting optimiser from [R04](../ai-contest-retail-china-r2/R04-front-warehouse-picking.md)
   — velocity + co-pick frequency + constraints. Metric: **pick-path metres per order**.
5. **(4 days)** One Western vendor adapter (`full_control` template), or a recorded-trace adapter if no
   vendor account exists — the adapter *contract* is the deliverable.
6. **(2 days)** [R10](../ai-contest-retail-china-r2/R10-robot-fleet-governance.md) zone gate and incident
   registry — **mandatory, not optional**, and simpler here because customers are absent.
7. **(3 days)** Operator console + measurement: **orders released before cut-off**, tasks per robot-hour,
   cross-fleet conflicts avoided, pick-path metres, cost per unit picked.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No DC, or single-vendor** | Step-1 gate with a defined fallback (work release + slotting only, no orchestration) |
| Vendor won't expose an API | Recorded-trace adapter; the contract is the deliverable. Also a commercial signal worth reporting. |
| Competing with a mature vendor scheduler | Explicitly out of scope — we release work and de-conflict *across* fleets; they move robots *within* one |
| **AI Act relevance** | ⚠ Warehouse **pick-rate monitoring is high-risk (worker performance monitoring)**. If the console shows per-person productivity, [W07](W07-compliant-workforce-ai.md)'s obligations apply. **Design it to show per-station and per-zone throughput, not per-person** — that is both compliant and better operations practice. |
| Safety in a mixed human/robot DC | R10's zones, and a stricter regime than a store: certified safety systems are the vendor's obligation, ours is task-level gating |
| Scope creep into a WMS | Line: work release, slotting, cross-fleet orchestration, outcomes. Not inventory management, not labour management, not receiving. |

## Demo script (3 minutes)

1. Two simulated fleets from different "vendors" in a DC layout ([R06](../ai-contest-retail-china-r2/R06-digital-twin-simulation.md)).
2. Replay a real order day → **work released backwards from the 17:00 carrier cut-off**, batched by
   pick-path overlap.
3. Two robots from different fleets meet at a congestion point → **Open-RMF mutex group serialises them**;
   turn it off to show the deadlock.
4. Slotting before/after: **pick-path metres per order −34%**.
5. Console shows **per-station throughput, deliberately not per-person** — with the one-line AI Act reason.
6. KPI: **orders released before cut-off**, treated vs control days, plus cost per unit picked.

## Effort

~20 dev-days, most of it reusing [R02](../ai-contest-retail-china-r2/R02-fleet-orchestration-openrmf.md),
[R04](../ai-contest-retail-china-r2/R04-front-warehouse-picking.md),
[R06](../ai-contest-retail-china-r2/R06-digital-twin-simulation.md) and
[R10](../ai-contest-retail-china-r2/R10-robot-fleet-governance.md). The genuinely new parts are the
work-release policy and the cut-off reframing.
