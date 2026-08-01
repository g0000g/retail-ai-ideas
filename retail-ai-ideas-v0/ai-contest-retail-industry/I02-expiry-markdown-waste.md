# I02 — Expiry-driven markdown & waste reduction

> **Sources:** InsiderOne (#9 sustainability & waste reduction; #5 "reduces spoilage or dead stock") ·
> NetSuite (perishables example — analysing historical inventory + demand data to refine how perishables are
> stored and displayed) · Innowise (sustainability and green retailing) — **3/8 sources**
> **Local model:** shares [I01](I01-price-markdown-optimization.md)'s elasticity + Chronos-2 from [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md) · **MiniMax:** no
> **New infra:** none · **GPU:** none · **Effort:** M (~2.5 weeks **on top of I01**) · **Verdict:** ⭐ hardest measurable outcome in any of the three sets

## Pitch

"Sustainability" in a retail AI deck is usually a slide with a leaf on it. Here it is a concrete
optimisation with a number attached:

> For every batch of stock with an expiry date, decide **when to mark it down and by how much**, so that
> it sells before it expires — recovering margin instead of writing it off.

Output: a daily markdown worklist per store, and a measured KPI — **kilograms (or units, or VND) not thrown
away**.

## Why this is the strongest "green" idea available to us

- It is **not a cost centre.** Waste reduction and margin recovery are the same action. You are not asking
  anyone to spend money to be virtuous.
- The measurement is unambiguous. Write-off value is already an accounting line. Before/after is visible in
  weeks, not quarters.
- It suits the **drugstore / F&B / supermarket** segments that VTI names, and it suits the demo category
  already recommended in the VTI catalogue (infant formula, supplements — high value, dated, strict rules).
- It is a genuinely *Vietnamese* problem: humidity, ambient logistics, short-dated dairy and fresh
  categories, and Tet demand cliffs that leave post-holiday overhang.

## The decision, precisely

For each `(SKU, batch, store)` with an expiry date:

```
days_left            = expiry − today
on_hand              = units in this batch at this store
baseline_demand      = Chronos-2 forecast for this SKU × store, next days_left days
uplift(discount)     = elasticity model from I01, in the near-expiry context
expected_sold        = f(baseline_demand, uplift(discount), shelf position, competing full-price stock)
expected_waste       = max(0, on_hand − expected_sold)
recovered_margin(d)  = expected_sold × (price×(1−d) − cost)  −  expected_waste × cost

choose d, and the day to apply it, that maximises recovered_margin
```

Two behaviours fall out of the maths that are worth pointing at in the demo:

1. **Discount early and shallow beats discount late and deep.** A 15% cut with 10 days left usually
   recovers more than 50% on the last day. The model finds this without being told.
2. **Sometimes the answer is "don't discount"** — if forecast demand clears the batch anyway, a markdown
   just gives away margin. A model that recommends *no action* is doing its job.

## Architecture

See `diagrams/industry-02-expiry-waste.drawio.png`.

```
Daily (workflow-service flow, early morning before store open)
  pgpool STANDBY
    ├─ stock-service: batch / lot with expiry date + on-hand per store   ⚠ see data risk below
    ├─ V03 Chronos-2 forecast: baseline demand per SKU × store
    ├─ I01 elasticity: near-expiry uplift curve per category
    ├─ price-service / goods-service: price, cost, shelf life, pack size
    └─ dim_calendar: Tet and holiday demand cliffs
                          ▼
  markdown optimizer (OR-Tools, CPU)
    per batch: optimal discount depth × application date
    store-level constraints: max % of assortment on markdown at once,
                             category markdown ladders, min margin, label-printing capacity
                          ▼
  ai_markdown_recommendation(sku, batch, store, days_left, on_hand,
                             recommended_discount, apply_date,
                             expected_units_saved, expected_waste_avoided_value)
                          ▼
  ┌────────────────────────┴──────────────────────────┐
  ▼                                                    ▼
Store worklist (POS / tablet)                    promotion-service
"mark down 12 items today"                       batch-scoped offer via the existing
print labels · scan to confirm applied           declarative offer schema + validator
  ▼
  └─▶ actual outcome captured → feeds back: realised uplift per category, per discount depth
                          ▼
  Waste dashboard (Grafana, LGTM already deployed)
     write-off value/week · waste avoided · margin recovered · markdown ROI
```

## The one hard data dependency — check it in week 1

**Does `stock-service` track batch/lot and expiry date per store?**

| Answer | What to do |
| --- | --- |
| Yes, batch + expiry + on-hand per store | Build the full plan |
| Expiry exists on the SKU but not per batch | Approximate: FEFO assumption + goods-receipt date + shelf-life attribute → estimated expiry per receipt. Less accurate, still useful. Say it's an estimate. |
| No expiry data at all | **The plan is not viable as specified.** Fall back to a *slow-mover / dead-stock* markdown model driven by days-of-cover instead of expiry — which is still valuable, still uses I01, and is honest. Decide this before committing. |

This is the single question that determines whether I02 is a 12-day extension of I01 or a different plan.
Ask it first.

## Build steps (assumes I01 phases 1–4 are done)

1. **(2 days)** Data check above + batch/expiry view on the read standby.
2. **(3 days)** Near-expiry uplift curve: fit from historical markdown events (clearance offers already in
   `promotion-service` history). Separate curves for fresh, ambient, health, non-food.
3. **(3 days)** Markdown optimizer with store-level constraints; explicit "no markdown" option.
4. **(3 days)** Store worklist on the POS/tablet: today's markdowns, label printing, **scan-to-confirm
   applied**. Without the confirmation step you cannot measure anything, because you won't know whether the
   markdown actually happened on the shelf.
5. **(2 days)** Offer creation in `promotion-service` scoped to the batch, through the existing schema +
   validator choke point.
6. **(2 days)** Feedback loop: realised sell-through vs predicted, per category and discount depth →
   re-fit the uplift curve monthly.
7. **(2 days)** Waste dashboard + the KPI set below.

## KPIs (this is the pitch)

| Metric | Why it matters |
| --- | --- |
| **Write-off value per week** (before vs after) | The headline. Already an accounting line, so it's credible. |
| **Waste avoided** — units and VND | Ties directly to the sustainability claim |
| **Margin recovered vs margin given away** | Guards against the failure mode of discounting things that would have sold |
| **Markdown ROI** = recovered margin ÷ discount cost | The number a CFO asks for |
| **Compliance rate** — recommended markdowns actually applied in store | Predicts everything else; if staff ignore the worklist, nothing works |
| kg CO₂e avoided (optional) | Only if a defensible factor exists. Don't invent one. |

## Risks

| Risk | Mitigation |
| --- | --- |
| **No batch/expiry data** | Week-1 check with a defined fallback (slow-mover markdown) |
| Discounting stock that would have sold anyway | The optimizer's "no markdown" option is a first-class outcome; measure margin given away separately from margin recovered |
| Store staff don't apply the markdowns | Scan-to-confirm; compliance rate as a tracked KPI; keep the daily worklist short (cap items per store per day) |
| Customers wait for the markdown instead of buying full price | Cap the share of assortment on markdown; vary timing; don't advertise the cadence. Real risk — name it. |
| **Health/pharma categories** | Never recommend markdown on anything where discounting near-expiry is restricted. Category-level blocklist, reviewed by compliance. Infant formula in particular. |
| Food-safety perception ("they're selling us old stock") | Clear date labelling, never sell past expiry, and the markdown is *disclosure*, not concealment |
| Double-discounting with an existing promotion | Check the promotion engine for overlapping active offers before creating the markdown offer |
| Greenwashing accusation | Only claim what is measured. Report VND and units; report CO₂e only with a citable factor. |

## Demo script (2.5 minutes)

1. Store manager's morning worklist: 12 batches to mark down today, sorted by value at risk.
2. Open one: 84 units of yoghurt, 6 days left, forecast will sell 40 at full price →
   recommend **−20% today**, expected 79 sold, **waste avoided ≈ 1.9M VND**.
3. Show one the model says **do not discount** — forecast clears it. Explain why that's the right answer.
4. Apply → scan to confirm → offer live in `promotion-service` → scan the item at POS, discounted price applies.
5. Waste dashboard: write-off value per week, treated stores vs control stores. **A real number, ours.**

## Effort

~17 dev-days **on top of I01**, or ~12 for the fallback slow-mover variant. Standalone it does not make
sense — the elasticity and optimizer work is shared. Build I01 first.
