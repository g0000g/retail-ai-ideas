# R03 — Last-mile robot & drone dispatch

> **Tier A — pure software, zero hardware** · **Effort:** S–M (~2.5 weeks) · **Verdict:** ⭐ cheapest real win in this folder

## The market is already there — we just have to plug into it

| Fact | Source |
| --- | --- |
| **Neolix (新石器)**: **17,000+ vehicles deployed**, targeting **50,000 by year-end**, **160M+ km driven**, **RaaS subscription model**; ranked **#1 globally** in last-mile unmanned delivery (June 2026 Road to Autonomy index) | [BigGo](https://finance.biggo.com/news/eb4d072e-451b-4a57-9d23-afc07b4af43a) |
| **Zelos**: **15,000 cumulative units**, 300+ Chinese cities, $400M Series B | same |
| China unmanned logistics market → **¥263.4B by 2030**, growth **>40%/yr** | [Seoul Economic Daily](https://en.sedaily.com/international/2026/04/07/no-drivers-seat-all-cargo-driverless-delivery-vehicles) |
| **Legal status exists**: 2023 guidelines from four ministries incl. MIIT permit **L3/L4 on public roads with national-level legal status**; Shenzhen/Shanghai/Hangzhou ordinances; Beijing pilot zone **160 → 600 km²** | [Seoul Economic Daily](https://en.sedaily.com/finance/2026/04/06/chinas-autonomous-delivery-vehicles-surge-ninefold-in-one) |
| **Meituan Keeta Drone**: 70+ routes across 6 cities, **880,000+ deliveries** by March 2026 | same |

**The RaaS model is the point.** Neolix sells *delivery as a subscription*. We do not buy vehicles — we
integrate with a service. This is an API integration, not a robotics project.

## The design insight everyone gets wrong

> **Meituan's Beijing Shunyi model uses unmanned vehicles to move parcels to transfer stations, with
> couriers completing the last hundred metres.**

Even the market leader runs a **hybrid**. A plan that assumes the robot completes the whole journey is less
credible than one that models the handoff — and the handoff is where the software value is.

So the deliverable is not "robot delivery". It is **a fulfilment-method decision plus a handoff protocol**.

## Architecture

```
order-service (existing: O2oFulfillmentController, DeliveryLogController)
        ▼
fulfilment-method decision  ← the actual product
   candidate methods per order:
     · human courier
     · autonomous vehicle (Neolix / Zelos, via vendor API)
     · drone (Keeta-class, route-constrained)
     · robot-to-transfer-station + human last 100m   ← THE HYBRID
   scored on: distance · weight/volume · time window · weather · route availability
              cost per method · COD? (robots handle cash poorly)
              recipient constraints (high-rise, gated compound, elderly recipient)
        ▼
dispatch adapter per vendor  (same shape as an Open-RMF fleet adapter — R02)
        ▼
tracking: vendor telemetry → order-service delivery log → customer ETA
        ▼
HANDOFF PROTOCOL — the part nobody builds
   arrival notification → pickup code → compartment opens → timeout → re-plan
   failed pickup → return-to-station → re-attempt or human fallback
        ▼
proactive notification (I07) · returns cause (I04) · cost per delivery (I06 holdout)
```

**Robots become a vehicle type in the existing routing problem**
([I08](../ai-contest-retail-industry/I08-delivery-route-optimization.md)), with different constraints:
fixed route networks, no stairs, weather limits, compartment size, and **no ability to hand over to a
person who isn't there.**

## Where each idea connects

| Connects to | How |
| --- | --- |
| [I08](../ai-contest-retail-industry/I08-delivery-route-optimization.md) | robots are a vehicle class in the same VRP — different capacity, speed and access constraints |
| [C03](../ai-contest-retail-china/C03-instant-retail-front-warehouse.md) | instant retail's 30-minute promise is where robot delivery is most valuable, and 3km is inside robot range |
| [I07](../ai-contest-retail-industry/I07-proactive-service-orders.md) | robot ETA feeds proactive notification; **failed pickup is a new proactive-service trigger** |
| [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md) | "late → no longer wanted" returns; robot delivery changes that curve |
| [R02](R02-fleet-orchestration-openrmf.md) | same adapter pattern; an indoor delivery robot in a mall is literally an RMF fleet |

## Build steps

1. **(2 days)** Fulfilment-method model in `order-service`: method enum, per-method constraints as
   **reviewable data** (not code), and the decision record on the order.
2. **(4 days)** Method scorer: distance, weight/volume, time window, weather, route availability, cost,
   COD flag, recipient constraints. Deterministic scoring — **no LLM in this path**, same rule as C03.
3. **(4 days)** One vendor adapter. If no vendor account is available, build against a **documented API
   shape + recorded trace** and say so — the adapter contract is the deliverable.
4. **(3 days)** **Handoff protocol**: arrival notification, pickup code, timeout, failed-pickup re-plan,
   human fallback. Model it as a state machine in `order-service`, not as ad-hoc calls.
5. **(2 days)** Telemetry → `DeliveryLogController` → customer ETA → [I07](../ai-contest-retail-industry/I07-proactive-service-orders.md) notifications.
6. **(2 days)** Measurement per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):
   **cost per delivery**, on-time rate, failed-pickup rate, and the method-mix over time. Holdout by zone.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No vendor account** | Phases 1–2 and 4 are vendor-independent. Adapter against a recorded trace; state it. |
| **Regulatory geography** — legal status varies by city | The 2023 national guidelines + city ordinances are real, but **coverage is per-city**. Encode route availability as data, per city, with an effective date. |
| Failed pickup (nobody comes down) | The handoff protocol is the mitigation, and the measurement. Expect a meaningful failure rate; Meituan's hybrid exists for this reason. |
| **COD** | Robots handle cash badly. Exclude COD orders from robot methods by rule, or require prepayment. This is a one-line constraint that saves a lot of grief. |
| Weather (drones especially) | Route availability feed; fall back to human courier automatically |
| Over-promising autonomy | **Lead with the hybrid.** "Robot to the transfer station, human for the last hundred metres" is what the market leader does. |
| Customer perception (elderly, high-rise) | Recipient constraints in the scorer; never force a method |
| Scope creep into operating a fleet | Line: **choose the method, dispatch, track, handle the handoff.** We do not own vehicles, routes or maintenance. |

## Demo script (2.5 minutes)

1. Three orders arrive. The scorer picks: one human courier (COD), one autonomous vehicle (3km, prepaid,
   flat route), one **hybrid** (robot to the transfer station, courier for the last 100m — a high-rise).
   Each decision shows its binding factor.
2. Track the robot delivery: telemetry → ETA → customer notification via
   [I07](../ai-contest-retail-industry/I07-proactive-service-orders.md).
3. **Simulate a failed pickup** → timeout → re-plan → human fallback → the customer is told, with options.
4. Change the weather feed to "rain" → the drone method disappears from the candidate set automatically.
5. Slide: **cost per delivery by method**, treated zones vs control, with a CI — next to Neolix's
   17,000-vehicle scale as *market context, not our claim*.

## Effort

~17 dev-days, **zero hardware**. Steps 1–2 and 4 (9 days) are useful even if no robot vendor is ever
signed — a fulfilment-method decision layer and a handoff state machine are worth having regardless.
