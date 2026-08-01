# I01 — Price & markdown optimization

> **Sources:** Oracle (*Lifecycle Pricing Optimization*; *Promotion, Markdown and Offer Optimization*) ·
> InsiderOne (#6 dynamic pricing + competitive intelligence, price elasticity modelling) ·
> EndearHQ (#2 Amazon/Walmart) · Emarsys (#9 dynamic pricing, #10 price sensitivity) — **4/8 sources**
> **Local model:** elasticity models (statsmodels / scikit-learn, CPU) + OR-Tools · `qwen3.5:4b` for explanation
> **New infra:** none · **GPU:** none · **Effort:** M–L (~4 weeks) · **Verdict:** ⭐ biggest gap across all three sets

## Pitch

Three connected decisions that no plan in the other two folders touches:

1. **Base price** — what should this SKU cost in this channel, given elasticity, competitor price and margin floor?
2. **Promotion depth** — if we discount, how deep, and what does it actually do to units and margin?
3. **Markdown cadence** — for seasonal/perishable/end-of-life stock, when to cut and by how much, so the
   inventory clears before it becomes worthless.

Output is always a **recommendation with a projected P&L impact**, for a pricing manager to approve.

## Why this is the highest-value gap

- It is the one area where the industry sources' numbers are loud and specific: Amazon repricing
  **~2.5 million times a day**; dynamic pricing claimed to lift **revenue up to 20% and profit up to 22%**
  (EndearHQ). Oracle sells three separate optimization products for it.
- **Pricing changes flow straight to margin.** A 1% price improvement on the same volume beats almost any
  cost saving elsewhere in the plans.
- The plumbing exists: `price-service` prices per channel, `promotion-service` + `core-components/promotion-engine`
  evaluate offers, `PriceItemSettingController` in goods-service exists, `order-service` has the transaction
  history needed to fit elasticity.
- Neither the NVIDIA set nor the VTI set proposed it. Adding it makes the combined submission cover the
  full **plan → buy → move → sell** loop that Oracle's AI Foundation describes.

## The modelling, honestly

**Elasticity from observational retail data is hard.** Prices are not set randomly — they move because of
promotions, competitor actions, seasonality and stock pressure, all of which also move demand. Naive
regression of units on price gives a biased, often *positively* sloped, answer.

What to do about it, in order of preference:

| Approach | When |
| --- | --- |
| **Use existing promotion history as quasi-experiments** | Promotions are discrete price changes with start/end dates — a natural before/after/control design. This is the most credible signal we already own. |
| **Log-log demand model with controls** — log(units) ~ log(price) + promo + holiday + stock + store + week fixed effects | The workhorse. Fit per category × store-cluster, not per SKU (too sparse). |
| **Hierarchical shrinkage** toward category elasticity | SKU-level estimates are noisy; shrink them. |
| **Deliberate price experiments** on a small SKU set | The only way to get a clean number. Cheap to run: 20 SKUs × 4 stores × 4 weeks. **Propose this in the deck** — it signals you know the difference between correlation and elasticity. |
| Causal-inference libraries (DoWhy / EconML, both permissive) | If time allows. Do not lead with them. |

**Never ship an elasticity you can't sanity-check.** A positive price elasticity means the model is
picking up promotion or seasonality confounding, not a Giffen good. Hard-reject those and fall back to the
category prior.

## Architecture

See `diagrams/industry-01-price-markdown.drawio.png`.

```
Nightly (workflow-service flow)
  pgpool STANDBY ──▶ price-change panel
                       units · price · promo depth · competitor price (if available)
                       stock cover · holiday/Tet · store cluster · margin
                          ▼
  model sidecar (CPU)
    ├─ elasticity fit per category × store-cluster (log-log + controls, hierarchical shrinkage)
    ├─ promo-lift model from historical promotion quasi-experiments
    └─ markdown model: remaining stock × remaining lifecycle × elasticity → optimal cut schedule
                          ▼
  optimizer (OR-Tools, Apache-2.0)
    maximise expected margin subject to:
      margin floor per SKU/category   ·  price-ladder / psychological endings (x9.000 VND)
      competitor gap band              ·  MAP / manufacturer-agreed pricing
      family & pack-size coherence     ·  max change frequency, max change magnitude
      legal: no price change on stock already in a customer's cart
                          ▼
  ai_price_recommendation(sku, store/channel, current, recommended, expected Δunits,
                          expected Δmargin, binding constraint, confidence, model_version)
                          ▼
  Pricing manager UI  ──approve──▶ price-service   (or promotion-service for a promo/markdown)
                          │
  ai-service pricing agent ◀┘   explain_price · simulate_price · list_margin_leaks
```

**Recommend, never auto-apply.** Every source that claims automated repricing is describing Amazon, which
has a decade of guardrails. A recommendation queue with a projected P&L and a one-click approve is the
right shape for a contest *and* for a first production release.

## Competitive intelligence — scope it or drop it

InsiderOne describes scanning competitor sites, catalogues and promotions. Reality check before promising it:

- **Marketplace prices we can already see legally**: our own Shopee/Lazada/TikTok listings and the public
  competitor listings on those platforms, via the connector work in
  [V06](../ai-contest-retail-vti/V06-omnichannel-product-sync.md). Start here — it is legitimate and cheap.
- **Scraping competitor websites** raises ToS, rate-limit and legal questions that are not worth resolving
  for a contest. If competitor data is needed beyond marketplaces, use a **paid data provider** or drop the
  feature and say why.
- Matching a competitor SKU to ours is itself a **product-matching problem** — `bge-m3` embeddings over
  title + brand + pack size, with human confirmation on low confidence. Reuses I05's normalisation work.

Recommendation: **v1 uses marketplace-visible prices only**, and the deck states the boundary explicitly.

## Where each model tier is used

| Step | Tier | Notes |
| --- | --- | --- |
| Elasticity, promo-lift, markdown models | none — classical stats on CPU | This is econometrics, not an LLM problem |
| Optimizer | OR-Tools, deterministic | |
| Competitor product matching | tier 0 `bge-m3` + confirm | |
| "Why this price?" narrative | tier 0 `qwen3.5:4b` from a **structured** input (elasticity, constraint, margin) | Never re-derive numbers in prose |
| Open-ended manager Q&A / scenario planning | tier 2 MiniMax-M2.5 | Aggregates only — **cost prices and margins never leave the rack** |

Margin and cost data is the most commercially sensitive thing in the platform. See the residency table in
[`../ai-contest-retail-vti/00-model-stack.md`](../ai-contest-retail-vti/00-model-stack.md) § 11.

## Build steps

**Phase 1 — data & guardrails (6 days)**
1. Price-change panel on the read standby: units, price, promo depth, margin, stock cover, store cluster.
   `dim_calendar` reused from V02/V03.
2. **Constraint model as data**: margin floors, price ladders, competitor bands, MAP rules, change-frequency
   caps. In a `pricing_rule` table with effective dates, reviewable by the commercial team.
3. Backfill and sanity-check: distribution of historical price changes, promo depth, realised lift.

**Phase 2 — elasticity (8 days)**
4. Promotion quasi-experiment extraction: matched before/after/control windows per past promotion.
5. Log-log models with controls, fitted per category × store-cluster; hierarchical shrinkage to category.
6. Validation: hold out recent promotions, compare predicted vs realised lift. **Report this, not R².**
7. Reject-and-fallback logic for implausible elasticities.

**Phase 3 — optimizer + recommendations (7 days)**
8. OR-Tools model maximising expected margin under the Phase-1 constraints.
9. `ai_price_recommendation` table with projected Δunits/Δmargin and the **binding constraint** recorded.
10. Recommendation queue UI: current vs recommended, projected P&L, why, approve/reject with reason.

**Phase 4 — markdown cadence (6 days)**
11. Lifecycle markdown: for seasonal/EOL stock, schedule cuts so remaining units clear by the target date,
    maximising recovered margin. Feeds directly into [I02](I02-expiry-markdown-waste.md).
12. Approve → `promotion-service` offer created through the existing declarative offer schema
    (which has a validator choke point — reuse it, don't bypass it).

**Phase 5 — agent + measurement (5 days)**
13. `explain_price`, `simulate_price`, `list_margin_leaks` MCP tools.
14. **Holdout measurement**: a control set of stores/SKUs kept on manual pricing so the effect is measurable.
    This is [I06](I06-ai-governance-measurement.md) applied — and without it the "+20% revenue" claim is
    someone else's number, not ours.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Elasticity is confounded** and the model recommends a loss-making cut | Promotion quasi-experiments; controls; shrinkage; implausible-sign rejection; margin floor as a hard constraint; propose a small deliberate experiment |
| A bad recommendation is approved and money is lost | Recommend-never-apply · projected P&L shown · margin floor · max change magnitude · reversible with one click · full audit with model version |
| Price changes annoy customers / look unfair | Change-frequency caps; never reprice an item already in a cart; no personalised pricing for individuals (see below) |
| **Personalised per-customer pricing** | ❌ **Out of scope, deliberately.** Personalised *offers* through `promotion-service` are fine and already planned in V05; personalised *base prices* are a fairness and regulatory problem. Say this out loud — it is a maturity signal. |
| Competitor scraping legality | Marketplace-visible data only in v1; boundary stated |
| Price-ladder / psychological pricing ignored by the optimizer | Encoded as a hard constraint (VND endings), not left to the model |
| Promotion engine conflicts (stacked offers on a repriced SKU) | Route markdowns through the existing offer schema and its validator; check overlap before creating |
| Cost/margin data leaving to tier 2 | Aggregates only; scrubber + OPA deny rule |

## Demo script (4 minutes)

1. Pricing queue: 40 recommendations ranked by projected margin impact. Total projected: +18M VND/week.
2. Open one: current 189.000, recommended 179.000, elasticity −1.4 (category prior −1.2, shrunk),
   projected +23% units, +6% margin, **binding constraint: competitor gap band**.
3. Ask *"tại sao không giảm sâu hơn?"* → margin floor is binding at 169.000. Numbers traceable.
4. Approve → offer created in `promotion-service` → add to a cart on the storefront → the new price applies.
   Real engine, real order.
5. Show a rejected recommendation: implausible positive elasticity → auto-rejected, fell back to category prior.
6. Holdout slide: treated vs control stores, realised margin delta with a confidence interval —
   **our number, not Amazon's**.

## Effort

~32 dev-days — the largest plan in any of the three folders, and the one with the largest expected value.
Phases 1–3 (21 days) give a working base-price recommender; phase 4 adds markdown and unlocks
[I02](I02-expiry-markdown-waste.md) cheaply.
