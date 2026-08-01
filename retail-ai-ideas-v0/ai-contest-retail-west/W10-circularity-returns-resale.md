# W10 — Circularity: returns → resale → reporting

> **Driver:** ESPR/DPP + CSRD + the €816B returns problem · **Effort:** M (~3 weeks) · **Verdict:** high — closes the loop [I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md) and [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md) open

## The three drivers, and why they are one project

| Driver | What it demands |
| --- | --- |
| **ESPR / DPP** ([W04](W04-digital-product-passport.md)) | durability, repairability, recycled content, **end-of-life information** — per product, on the EU market |
| **CSRD / ESG reporting** | auditable environmental figures, not estimates. *"DPP infrastructure can serve double duty for ESG reporting, emissions tracking and circular programmes from the same data investment"* |
| **Returns cost** | Emarsys cites **$816 billion annual cost of returns** ([I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md)). [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md) reduces returns; **W10 recovers value from the ones that still happen** |

**One data spine, three uses.** That is the fundable framing, and it is the same argument as W04's.

## What happens to a return today, and where the money leaks

```
return arrives  →  inspect (manual, inconsistent)  →  one of:
      back to sellable stock          ← highest value, often under-used out of caution
      discount / outlet               ← value recovered, margin lost
      refurbish / repair              ← rarely attempted without a decision rule
      liquidate to a jobber           ← cents on the euro
      recycle                         ← cost, but compliant
      landfill                        ← worst outcome, and increasingly a reportable one
```

**The leak is the inspection decision.** It is made by a person, in seconds, without knowing the item's
resale value, the current stock position, or what the same SKU's returns usually turn out to be. Grade it
too harshly and you liquidate sellable stock; too leniently and you ship a faulty item to the next customer
— which becomes a second return.

**That is a scoring problem with an existing feature set.** [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md)
already computes return risk, root cause and product-level return history. W10 reuses it at the other end.

## The disposition engine

```
return received  →  disposition scoring
   inputs:
     return reason code (I04's taxonomy — the gate: if reasons are useless, so is this)
     product: category, resale value, seasonality, current stock position vs V03 forecast
     condition: inspector grade + PHOTO (PP-ShiTuV2 / VLM assist, C05's pipeline)
     history: how this SKU's returns have graded and resold before
     cost: refurbish cost, outlet channel margin, liquidation price, recycling cost
     DPP: repairability and recyclability data (W04)
   output:
     recommended disposition + expected recovered value + confidence + reason
   ⚠ RECOMMEND, never auto-dispose. An inspector confirms.
        ▼
  ├─ back to sellable   → stock-service, restocked with a condition flag
  ├─ outlet / discount  → promotion-service offer, channel = OUTLET
  ├─ refurbish          → task, then re-enters as grade-B stock
  ├─ resale channel     → a second-hand listing (own or marketplace)
  ├─ recycle            → recycler, with the DPP material data attached
  └─ dispose            → last resort, and it is REPORTED
        ▼
  outcome → ai_decision (I06) → recovery rate by disposition, per category
        ▼
  CSRD / ESG export: units diverted from disposal · value recovered ·
                     materials recycled (from DPP composition data)
```

**Two design calls:**

1. **Recommend, never auto-dispose.** Same posture as pricing, replenishment and returns risk everywhere
   else in these folders. The inspector confirms; the override rate is the trust KPI.
2. **Condition grading needs a photo and a consistent scale**, or the whole thing is noise. A VLM assist on
   a standardised photo (fixed station, fixed lighting) makes grades comparable between inspectors — which
   is worth more than the model's own accuracy.

## Where it connects

| Plan | Relationship |
| --- | --- |
| [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md) returns prevention | I04 stops returns; W10 recovers value from those that happen. **Same feature pipeline, same reason codes.** |
| [I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md) expiry markdown | Same shape: *"either it moves at the right price at the right time, or it is written off."* W10 is I02 for returns instead of dates |
| [W04](W04-digital-product-passport.md) DPP | supplies repairability/recyclability/composition; W10 supplies end-of-life *actuals* back |
| [I01](../ai-contest-retail-industry/I01-price-markdown-optimization.md) pricing | outlet pricing is a markdown problem with a different elasticity — reuse the optimiser, refit the curve |
| [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md) recognition | identify the returned item from a photo when the label is gone — a real and common case |
| [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) | holdout by category; the metric is **value recovered per return**, not disposition speed |

## Build steps

1. **(2 days)** ⚠ **Gate**: are return reason codes usable? Same gate as
   [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md) phase 1 — if 90% are "other",
   fix the taxonomy first and wait for data. Also: does a disposition record exist at all today, or is it
   a spreadsheet?
2. **(3 days)** Disposition data model + the cost/value table per channel (refurbish cost, outlet margin,
   liquidation price, recycling cost) — **as reviewable data**, per category.
3. **(3 days)** Standardised inspection station: fixed photo, fixed grade scale, VLM-assisted grading
   suggestion (C05 pipeline). The **consistency** is the product, not the model.
4. **(4 days)** Disposition scorer + expected-recovered-value estimate + reason. Recommend-only.
5. **(2 days)** Routing into `stock-service` (condition-flagged restock), `promotion-service`
   (outlet offers), refurbish tasks, recycler handoff with DPP data attached.
6. **(2 days)** **CSRD/ESG export**: units diverted from disposal, value recovered, materials recycled —
   from the same records, no separate reporting pipeline.
7. **(2 days)** Measurement: **value recovered per return**, disposition mix, restock-to-second-return rate
   (the counter-metric that stops over-lenient grading), inspector override rate.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Reason codes and disposition records don't exist** | Step-1 gate. Without them this is a data-capture project first, and that is a fine honest answer |
| **Over-lenient grading → second returns** | The counter-metric is explicit: restock-to-second-return rate. If it rises, the grading threshold is wrong. Track it from day one, not after complaints. |
| Photo grading inconsistent across sites | Fixed station, fixed lighting, fixed scale. The model assists; the standardisation does the work. |
| Greenwashing accusation | Report only what is measured: units, value, materials from DPP composition. **CO₂e only with a citable factor** — same rule as [I02](../ai-contest-retail-industry/I02-expiry-markdown-waste.md) |
| Outlet cannibalises full-price sales | Channel and timing rules; measure full-price sales in treated categories, not just outlet revenue |
| Health, cosmetics, food, safety-critical categories | **Category blocklist for restock**, reviewed by compliance. Some things never go back on a shelf, and that is not a model decision |
| Second-hand resale is a new business line | Out of scope as an operation. We produce the *recommendation* and the listing data; whether to run a resale channel is a commercial decision |
| Scope creep into reverse logistics | Line: disposition decision, routing, reporting. Not transport, not warehouse operations, not refurbishment itself |

## Demo script (2.5 minutes)

1. A return arrives at the inspection station: photo taken, **VLM grade suggestion** with the reference
   scale beside it — inspector confirms in two seconds.
2. Disposition recommendation: *"back to sellable stock — grade A, forecast says this SKU sells through in
   9 days, expected recovery €54 vs €11 liquidation."* With the reason.
3. Second item: *"outlet at −30% — cosmetic damage, category X, expected recovery €22."* → offer created in
   `promotion-service` on the OUTLET channel.
4. Third: *"recycle — non-repairable"* → recycler handoff **with the DPP material composition attached**,
   which is the bit that makes the ESG number auditable.
5. Dashboard: **value recovered per return** by category, disposition mix, and the counter-metric —
   restock-to-second-return rate.
6. CSRD export from the same records: units diverted from disposal, materials recycled. One data
   investment, two obligations, one P&L line.

## Effort

~18 dev-days, of which ~5 are saved if [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md)
and [W04](W04-digital-product-passport.md) exist. Sequence: I04 → W04 → W10.
