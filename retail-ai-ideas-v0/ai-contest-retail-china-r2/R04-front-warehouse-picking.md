# R04 — 前置仓 goods-to-person picking orchestration

> **Tier D — needs a real fleet** · **Effort:** M–L (~4 weeks of software, on top of a $500k–$5M hardware decision)
> **Verdict:** high business value, hardware-gated — **document it, build R06's simulation of it**

## Why it matters

[C03](../ai-contest-retail-china/C03-instant-retail-front-warehouse.md) decides *what to stock in each 3km
warehouse* and *which warehouse serves each order*. R04 is the physical step in between: **getting the items
off the shelf and into the rider's hand inside a 30-minute promise.**

Market context from [00-china-robotics-market.md](00-china-robotics-market.md):
- Instant retail **> ¥1T in 2026**; **50,000+ front warehouses** nationwide, density +40%.
- Meituan: **150M instant-retail orders in a single day**.
- **Geek+ RMS coordinates 5,000 AMRs in one warehouse**; **Quicktron** was first in China to coordinate
  **1,000 AMRs in one scenario**; **HAI Robotics HAIPICK** is autonomous case-handling (ACR) for
  high-density storage.
- **Price bands**: goods-to-person shelf carriers **$25k–50k/unit**, transport AMRs $25k–80k, pallet AGVs
  $15k–50k, sorting robots $10k–30k. **Full systems $500k–$5M.** Chinese vendors 40–60% below Western.

**The economics only work at volume.** A 前置仓 doing 300 orders/day does not justify a $500k system; one
doing 3,000 might. That is a calculation, not an opinion — and [R06](R06-digital-twin-simulation.md)
produces it.

## What is ours vs. what is the vendor's

| Layer | Owner |
| --- | --- |
| Robot hardware, charging, maintenance | vendor (Geek+ / Quicktron / HAI) |
| Robot fleet scheduling inside the warehouse | **vendor RMS** — do not compete with a 5,000-AMR scheduler |
| **Which orders to release, when, in what batch** | **ours** |
| **Where each SKU should live** (slotting) | **ours** — it is [C03](../ai-contest-retail-china/C03-instant-retail-front-warehouse.md)'s assortment plan plus velocity |
| **Handoff to the rider** | **ours** — order-service, staging, and the 30-minute clock |
| **Cross-vendor coordination** if the site has more than one fleet | **ours** → [R02](R02-fleet-orchestration-openrmf.md) |

**The line that keeps this plan honest: we do not build a WMS and we do not schedule AMRs.** We decide
*what work to release and when*, and we own the clock.

## Architecture

```
C03 sourcing decision → order assigned to this 前置仓
        ▼
ORDER RELEASE POLICY   ← ours, and the only real algorithm here
  batch orders by: pick-path overlap · promise deadline · rider arrival ETA
                   temperature zone (ambient / chilled / frozen picked separately)
  release wave → vendor RMS
        ▼
VENDOR RMS (Geek+ / Quicktron / HAI)  —  black box, API
  goods-to-person: shelf carrier brings the rack to a pick station
  ACR: case handling from high-density storage
        ▼
PICK STATION  (human, augmented)
  pick-to-light + PP-ShiTuV2 verification (C05) → wrong-item catch before it ships
        ▼
STAGING + HANDOFF
  rider arrives → tote assignment → scan-out → order-service delivery log
        ▼
ACTUALS → recalibrate pick time per SKU, per zone, per station (C03's tunable knob)
```

**Slotting is where the AI is.** Which SKU sits closest to the pick station is a function of forecast
velocity ([C03](../ai-contest-retail-china/C03-instant-retail-front-warehouse.md)'s Chronos-2 output),
co-pick frequency (items bought together should be near each other), and physical constraints. That is an
optimisation over data we already have — and it is worth more than any robot choice.

## Why it is Tier D — and what to do instead

The software above is ~4 weeks. The prerequisite is a **$500k–$5M capital decision** and a warehouse that
exists. For a contest:

1. **Build the slotting optimiser** — it works with or without robots. Manual pickers benefit from good
   slotting too, and the gain is measurable in pick-path metres.
2. **Simulate the robot layer in [R06](R06-digital-twin-simulation.md)** — answer *"how many pick stations
   and carriers for 3,000 orders/day at a 30-minute promise?"* with a curve, not a guess.
3. **Write the vendor adapter contract**, don't implement it. The RMS API shape is knowable from vendor
   docs; the adapter is the same pattern as [R02](R02-fleet-orchestration-openrmf.md)'s.

That is three weeks of genuinely useful work with **zero hardware**, and it produces the business case that
would justify tier D later.

## Build steps (the tier-A/B subset — recommended)

1. **(3 days)** Warehouse layout model: zones, pick stations, storage locations, temperature zones.
2. **(5 days)** **Slotting optimiser** — velocity from C03's forecast + co-pick frequency + constraints
   (weight, temperature, size). OR-Tools assignment problem. Metric: **pick-path metres per order**.
3. **(4 days)** **Order-release policy**: wave batching by pick-path overlap, deadline and rider ETA.
   Simulate against replayed real order streams (R06's harness).
4. **(3 days)** Pick verification via [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md)
   at the station — wrong-item catch before dispatch. Reuses the gallery unchanged.
5. **(3 days)** Handoff state machine: staging, tote assignment, rider scan-out, `order-service` log.
6. **(3 days)** [R06](R06-digital-twin-simulation.md) scenario: robots-vs-throughput curve at vendor price
   bands → **the capital business case**.
7. *(deferred)* vendor RMS adapter — contract written, implementation gated on procurement.

## Risks

| Risk | Mitigation |
| --- | --- |
| **The capital decision is not ours to make** | Deliver the business case (step 6), not the deployment |
| No 前置仓 exists yet | Then this is a plan for a future format. The slotting optimiser still applies to any stockroom. |
| Competing with a vendor's 5,000-AMR scheduler | Explicitly out of scope. We release work; they move robots. |
| Temperature-zone complexity (ambient/chilled/frozen) | Model it from day one — separate picks, separate totes. Retrofitting it is painful. |
| Pick-station throughput becomes the bottleneck, not the robots | The simulation exposes this. It is the most common real-world surprise in goods-to-person. |
| Scope creep into a WMS | Line: slotting, release policy, verification, handoff. |

## Demo script (2 minutes)

1. Slotting before/after for one 前置仓: **pick-path metres per order down 34%**, with the constraint that
   bound (frozen zone separation).
2. Order-release simulation on a replayed real day: wave batching vs FIFO, 95th-percentile pick-to-handoff
   time.
3. R06 curve: *"2 carriers + 1 station holds the 30-minute promise to 1,800 orders/day; 3,000 needs 4 + 2 —
   here is the cost at $25k–50k per carrier."*
4. Pick verification catches a wrong item at the station via C05.
5. State plainly: **the software is built and simulated; the hardware is a capital decision with a number
   attached.** That honesty is the point of the slide.

## Effort

~21 dev-days for the tier-A/B subset (slotting + release + verification + handoff + business case).
The vendor adapter adds ~10 days **after** procurement, not before.
