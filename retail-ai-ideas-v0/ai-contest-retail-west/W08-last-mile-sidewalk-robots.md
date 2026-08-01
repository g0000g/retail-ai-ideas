# W08 — Sidewalk / road delivery robots + micro-fulfilment

> **Driver:** Western last-mile economics · **Effort:** M (~2.5 weeks) · **Verdict:** medium — the plan is sound, the market evidence is thinner than China's

## Honest position first

The China round had hard numbers for autonomous delivery — **Neolix 17,000+ vehicles, 160M+ km, RaaS
subscription, national-level legal status from 2023 guidelines, Beijing's pilot zone 160 → 600 km²**
([R03](../ai-contest-retail-china-r2/R03-last-mile-robot-dispatch.md)).

**This round's searches did not surface equivalent Western deployment numbers.** What they did surface is
adjacent and relevant:

- **Amazon is investing ≥€10B in European fulfilment robotics** — but that is inside the building.
- **Symbotic and Walmart are co-developing store-level micro-fulfilment** — which changes *where the
  last mile starts*, and that is the more important Western signal.
- *"The fast-growing popularity of micro-fulfillment centers"* was cited as one of the forces undermining
  in-store shelf robots.

⚠ **So the Western sidewalk/road-robot claims in this plan are marked unverified.** Starship, Serve
Robotics, Nuro, Kiwibot and Wing operate in the West, and regulation is state/city-level in the US and
member-state-level in the EU — but **this round produced no citation for their 2026 scale**. Treat vendor
selection as an open procurement question, exactly as the China round treated in-store shelf-robot vendors.

**What survives that caveat is the software**, which is vendor-independent and the same shape as R03.

## The reframing that makes this Western

**Micro-fulfilment moves the origin, not the vehicle.**

In China the last-mile question was *"which robot serves this 3km order from a 前置仓?"*
In the West, with Symbotic/Walmart-style **store-level micro-fulfilment**, the question becomes:

> **Which origin, which method, and which promise — where "origin" now includes the store's automated
> micro-fulfilment cell, not just the DC?**

That is a **sourcing** decision before it is a **dispatch** decision, and sourcing is where our services
already live ([`order-service`](../ai-contest-retail-china/C03-instant-retail-front-warehouse.md) O2O
fulfilment, `stock-service`, `channel-service`).

## Architecture

```
order-service   (O2oFulfillmentController, DeliveryLogController — existing)
        ▼
1 · ORIGIN DECISION      ← the Western addition
     candidates: DC · store micro-fulfilment cell · store shelf pick · dark store · 3PL
     scored on: stock availability · pick cost per unit · distance · promise ·
                carrier cut-off (W05) · whether the origin can even reach the customer
        ▼
2 · METHOD DECISION      ← R03's scorer, unchanged
     human courier · sidewalk robot · road AV · drone ·
     robot-to-locker/transfer + human last stretch   ← THE HYBRID, again
     scored on: distance · weight/volume · time window · weather · route availability ·
                cost · COD · recipient constraints (walk-up, apartment, gated, elderly)
        ▼
3 · DISPATCH ADAPTER per vendor   (same shape as an Open-RMF fleet adapter)
        ▼
4 · HANDOFF PROTOCOL — state machine in order-service
     arrival → pickup code → compartment/locker opens → timeout →
     failed pickup → return-to-base → re-attempt or human fallback
        ▼
5 · tracking → customer ETA → I07 proactive notification
        ▼
measurement: cost per delivery BY ORIGIN × METHOD · on-time · failed-pickup rate
```

**Steps 2–5 are [R03](../ai-contest-retail-china-r2/R03-last-mile-robot-dispatch.md) verbatim.** Step 1 is
new, and it is the part that matters more in the West because micro-fulfilment makes origin a real choice
rather than a default.

## Two Western-specific constraints R03 did not have

### 1 · Regulation is local, and it is not one rule
China had a **national-level legal status** for L3/L4 delivery vehicles from 2023 four-ministry guidelines,
with city ordinances layered on top. The West has **no equivalent national baseline** — sidewalk-robot
permission is city- or state-level in the US and member-state (often municipal) in the EU.

**Design consequence:** `route_availability` is a **data table keyed by jurisdiction with effective dates**,
and it must be maintained by someone. Same pattern as
[`I01`](../ai-contest-retail-industry/I01-price-markdown-optimization.md)'s pricing rules and
[`W07`](W07-compliant-workforce-ai.md)'s labour rules — **third time this pattern appears, which is the
architectural point.**

### 2 · GDPR on the recipient
A delivery robot with cameras, arriving at a home, is a privacy surface China's plan did not have to argue
about in the same terms:
- **no facial recognition** at the handoff — pickup code or app confirmation only
- camera footage for navigation, **not retained**, not used for anything else
- the recipient's address is PI: minimise what the vendor receives, and contract for deletion
- **DPIA** before a pilot

## Build steps

1. **(2 days)** ⚠ **Viability gate**: do we operate any micro-fulfilment or own-fleet delivery, and is any
   robot vendor operable in the target city? If neither, this reduces to the **origin decision** (step 3),
   which is worth building regardless.
2. **(2 days)** `route_availability` and `origin_capability` as data, keyed by jurisdiction, with effective
   dates and an owner.
3. **(4 days)** **Origin decision** scorer — stock, pick cost per unit, distance, promise, cut-off,
   reachability. Deterministic, no model in the path.
4. **(3 days)** Method scorer — reuse R03's, plus the Western constraint set.
5. **(3 days)** **Handoff protocol** state machine, including the **locker** variant that is common in
   Europe and absent from the China plan.
6. **(2 days)** Tracking → ETA → [I07](../ai-contest-retail-industry/I07-proactive-service-orders.md);
   failed pickup as a proactive trigger.
7. **(2 days)** GDPR: DPIA, data-minimisation contract terms, no biometric handoff.
8. **(2 days)** Measurement: **cost per delivery by origin × method**, on-time, failed-pickup, and
   method-mix drift over time. Holdout by zone
   ([I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md)).

## Risks

| Risk | Mitigation |
| --- | --- |
| **Vendor scale in the West is unverified** | Stated up front. The software is vendor-independent; step 1 gates the integration |
| **Regulation is city-level and changes** | Route availability as data with effective dates and a named owner. Never hard-code a city. |
| No micro-fulfilment exists | The origin decision still applies across DC / store / dark store / 3PL — and it is the most valuable step here |
| Failed pickup | The handoff state machine, plus lockers, which fail far less often than doorstep handoffs |
| **COD** | Same one-line rule as R03: exclude from robot methods or require prepayment |
| Weather, especially for drones | Route-availability feed; automatic fallback to human courier; never block dispatch on an external API |
| GDPR at the doorstep | DPIA, no biometrics, minimise what the vendor receives, contractual deletion |
| Over-claiming autonomy | **Lead with the hybrid**, as R03 does. Robot-to-locker plus a human stretch is the realistic pattern. |
| Scope creep into operating a fleet | Line: choose origin, choose method, dispatch, track, handle handoff. |

## Demo script (2.5 minutes)

1. Three orders. The **origin scorer** picks: one from the DC (bulky, cheap pick), one from the store
   micro-fulfilment cell (fast promise, customer nearby), one from a shelf pick (single item, store has it).
   Each shows its binding factor.
2. The **method scorer** then picks per order: courier (COD), sidewalk robot (short, prepaid, permitted
   route), **robot-to-locker + walk-up** for an apartment block.
3. Flip a city's `route_availability` row to "not permitted" → the robot method disappears from the
   candidate set automatically. **Regulation as data.**
4. Simulate a failed pickup → timeout → re-plan → customer told, with options
   ([I07](../ai-contest-retail-industry/I07-proactive-service-orders.md)).
5. Slide: **cost per delivery by origin × method**, treated zones vs control, with a CI — and the honest
   note that Western robot-vendor scale was not verifiable in this research round.

## Effort

~20 dev-days. **Steps 3 and 5 (7 days) — the origin decision and the handoff state machine — are worth
building even if no delivery robot is ever contracted**, because micro-fulfilment makes origin selection a
real problem on its own.
