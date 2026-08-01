# I04 — Returns prediction & prevention

> **Sources:** Emarsys (#6 *"the returns revolution"* — predict likely returns from customer data and
> product attributes; **$816 billion annual cost of returns**) · NetSuite (simplified return processing) —
> **2/8 sources, but the single largest cost figure quoted anywhere in the eight**
> **Local model:** gradient boosting + SHAP (CPU) + `bge-m3` · `qwen3.5:4b` for guidance copy
> **New infra:** none · **GPU:** none · **Effort:** M (~3 weeks) · **Verdict:** high

## Pitch

Predict, at the moment of purchase, how likely this order line is to come back — and then **do something
about it before it ships**.

Not fraud detection. Not returns *processing*. **Returns prevention**: the return that never happens is
worth more than the one handled efficiently.

## Distinct from the abuse plan

| | [N-10 return abuse](../ai-contest-retail/10-return-fraud-detection.md) | **I04 (this)** |
| --- | --- | --- |
| Question | *Is this customer gaming us?* | *Will this item come back, and can we stop it?* |
| Subject | a minority of bad actors | every honest order |
| Action | route to CS review | fix the listing, the size guidance, the packaging, the courier |
| Failure cost | falsely accusing a customer | a missed opportunity |
| Signal | graph / identity clustering | product, content, fit, logistics, expectation gap |

They share a feature pipeline and a table. They are not the same product, and conflating them is how teams
end up accusing customers of fraud for returning a shirt that didn't fit.

## Where returns actually come from (and what to do about each)

| Root cause | Detectable from | Prevention action |
| --- | --- | --- |
| **Size / fit wrong** | category, size chart, customer's past size history, return reason codes | size guidance on the PDP: *"khách có vóc dáng tương tự thường chọn size L"* |
| **Expectation gap** — item ≠ photos/description | high return rate concentrated on one SKU, reason = "không giống mô tả" | flag the listing for content fix → feeds [N-02](../ai-contest-retail/02-catalog-enrichment.md) / [I05](I05-product-data-quality.md) |
| **Damaged in transit** | reason code, courier, route, packaging type | packaging rule change, courier scorecard |
| **Late delivery → no longer wanted** | promised vs actual delivery date | ties to [I07](I07-proactive-service-orders.md) |
| **Wrong item shipped** | picking error, SKU confusion | pick-verification; often a symptom of duplicate SKUs → [I05](I05-product-data-quality.md) |
| **Bracketing** (ordering 3 sizes to keep 1) | multiple sizes of the same SPU in one basket | size guidance + a gentle nudge, never a block |
| **Buyer's remorse / impulse** | daypart, discount depth, time-to-return | little to do; measure it so it isn't confused with a fixable cause |

**This table is the plan.** A return-probability score with no root cause is a number nobody can act on.
The deliverable is *cause-attributed* risk.

## Architecture

See `diagrams/industry-04-returns.drawio.png`.

```
Nightly training + real-time scoring
  pgpool STANDBY ──▶ feature build
       order line:   category · price · discount depth · size/variant · first-time-buy of this SPU
       customer:     return rate (30/90/365d), size history, tenure  (aggregates, never PII to tier 2)
       product:      SKU return rate, reason-code mix, content completeness (from I05),
                     image count, description length
       logistics:    courier, promised vs actual lead time, packaging type, distance
       context:      channel, daypart, promotion, Tet proximity (dim_calendar)
                          ▼
   gradient boosting (XGBoost/LightGBM, CPU) → P(return) per order line
   + SHAP → the top contributing factors, mapped to a ROOT-CAUSE CLASS
                          ▼
   ai_return_risk(orderLineId, p_return, root_cause_class, top_factors[], model_version)
                          ▼
  ┌───────────────┬─────────────────────┬──────────────────────┬─────────────────────┐
  ▼               ▼                     ▼                      ▼                     ▼
PRE-PURCHASE   PRE-SHIP              POST-SHIP            MERCHANDISING        FINANCE
size guidance  pick verification     proactive check-in   SKU content fix      returns reserve
on the PDP     packaging upgrade     (see I07)            queue                forecast
(storefront)   for fragile+risky                          (N-02 / I05)         (accrual)
```

**Every intervention is additive and non-punitive.** Nothing blocks a purchase. Nothing charges a customer.
The system either gives better information, packs the item better, or fixes a bad listing.

## The one intervention worth building first

**Size / fit guidance from return-reason history.** It is:
- the largest single return cause in apparel/footwear and a real one in baby/kids categories
- computable from data we already have (past orders, past returns with reason codes, size charts)
- deliverable as a single sentence on the PDP
- measurable with a clean A/B — show it to half the sessions

Everything else in the diagram is a phase-2 refinement.

## Where the tiers are used

| Step | Tier | Notes |
| --- | --- | --- |
| Risk model + SHAP | none — classical ML on CPU | |
| Root-cause classification | rules over SHAP factors first; small model only for the residue | Rules first, as always |
| Size-guidance sentence | tier 0 `qwen3.5:4b` from a structured input | Templated + validated; never invents a size |
| Merchandising fix suggestion for a bad listing | tier 0, escalate to MiniMax for a rewrite | Public catalogue text — safe for tier 2 |
| Anything containing customer identity | **tier 0 only** | Aggregated return rates, never named customers |

## Build steps

**Phase 1 — reason codes and honesty about them (3 days)**
1. Audit `after-sales-service` return reason codes. **This is the gate:** if reasons are a single free-text
   field or 90% "khác", the root-cause half of this plan is not viable until the taxonomy is fixed.
   Fixing it is a one-day change plus a CS conversation — do that first, then wait for data.
2. Return panel on the read standby: order line ↔ return ↔ reason ↔ courier ↔ timing.

**Phase 2 — risk model (6 days)**
3. Feature build; time-based train/test split (never random — returns are temporal).
4. XGBoost + SHAP. Metric: **precision@k on the top-risk decile**, and calibration (a 30% prediction should
   return 30% of the time). Report calibration — it's what makes the score usable for a finance accrual.
5. Root-cause classification from SHAP factors via rules.

**Phase 3 — size guidance (5 days)**
6. Per SPU × category: distribution of kept vs returned sizes, conditioned on the customer's size history.
7. PDP component on `ecommerce-front-end`; **A/B from day one** (this is [I06](I06-ai-governance-measurement.md) applied).
8. Vietnamese copy generated tier 0 from the structured recommendation, validated.

**Phase 4 — operational hooks (5 days)**
9. Merchandising queue: SKUs whose returns concentrate on "không giống mô tả" → listing-fix task.
10. Courier/packaging scorecard: return-for-damage rate by courier and packaging type.
11. Pre-ship pick verification prompt for high-risk + high-value lines.

**Phase 5 — finance (3 days)**
12. Returns-reserve forecast: expected returns value by week from the calibrated model. Finance loves this
    and nobody demos it.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Reason codes are useless** | Phase-1 gate. Without them, ship the risk score + size guidance and skip root-cause attribution — and say so. |
| Score used to punish customers (refuse service, charge fees) | **Explicit design rule: no customer-facing penalty, ever.** Interventions are informational, logistical or merchandising. Put this rule in the deck. |
| Model learns proxies for protected attributes | Feature review; exclude anything that proxies for demographics; audit SHAP factors for the top decile |
| Bracketing nudge feels manipulative | Informational only ("size L phù hợp hơn với đơn trước của bạn"); never block or surcharge multi-size baskets |
| Class imbalance (returns are rare in some categories) | Per-category models where volume allows; report per-category, don't average the failure away |
| Size guidance is wrong and *causes* a return | Only show it above a confidence threshold and with enough historical support; measure the A/B — if the treated arm returns more, kill it |
| Confusing this with fraud detection | Separate table, separate UI, separate language. Share only the feature pipeline. |

## Demo script (3 minutes)

1. Storefront PDP for a kids' jacket: *"Khách có chiều cao/cân nặng tương tự thường chọn size L"* —
   with the sample size behind it visible on hover.
2. Back-office returns dashboard: predicted returns value next week (calibrated), by root cause.
3. Merchandising queue: one SKU with a 34% return rate, 80% reason "không giống mô tả" → open it, the
   product photos are of the wrong colourway. Send to the catalogue-fix queue.
4. Courier scorecard: courier B has 3× the damage-return rate on fragile items → packaging rule proposed.
5. A/B slide: size guidance on vs off, return rate delta with a confidence interval — **our number**,
   next to Emarsys's $816B industry figure for context.

## Effort

~22 dev-days. Phases 1–3 (14 days) deliver the score plus the one intervention that actually moves the
metric.
