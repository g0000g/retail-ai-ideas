# V03 — Demand forecasting on Chronos-2 (zero-shot, covariate-aware)

> **VTI source:** case study *"AI Demand Forecasting Delivers 10% Higher Sales"* (Japan) + "AI-powered demand forecasting", "Automated inventory management"
> **Local model:** `autogluon/chronos-2` — Apache-2.0, **120M params, CPU inference** · **MiniMax:** only for the explanation layer
> **New infra:** none (model sidecar) · **GPU:** none · **Effort:** M (~3 weeks) · **Verdict:** ⭐ best pick

## Pitch

Per SKU × store × day: forecast demand, compare to on-hand + in-transit + vendor lead time, emit a
**purchase-order suggestion** a buyer approves in one click. Plus stockout-risk ranking before Tet.

## Why Chronos-2 instead of training anything

This is the single biggest technical improvement over the NVIDIA-set equivalent
([`../ai-contest-retail/05-demand-forecast-replenishment.md`](../ai-contest-retail/05-demand-forecast-replenishment.md),
which proposed a five-model sklearn ensemble).

| | sklearn ensemble (RF/XGB/GBM/Ridge/SVR) | **Chronos-2** |
| --- | --- | --- |
| Training | fit + tune 5 models × per-series selection | **none — zero-shot** |
| Covariates (promo, price, holiday, store) | manual feature engineering | **native covariate support** |
| Cold start (new SKU/store) | needs a heuristic fallback | zero-shot handles it far better |
| Size / runtime | small but 5× the code | 120M, encoder-only, **CPU supported** |
| Licence | libraries permissive | **Apache-2.0** |
| Evidence | none out of the box | best pretrained-model results on fev-bench, GIFT-Eval, Chronos Benchmark II |

Released Oct 2025; handles univariate, multivariate **and** covariate-informed forecasting in one
architecture, with the largest gains on tasks that include exogenous features — i.e. exactly retail.
Lighter fallback if memory is tight: `chronos-bolt-small` (48M) / `-base` (205M), Apache-2.0, up to 250×
faster and 20× more memory-efficient than original Chronos.

**Honest caveat for the pitch:** Chronos-2 trained on real *plus large-scale synthetic* data and its
leaderboard numbers may overlap public retail datasets. Validate on our own held-out SKUs and show that
backtest, not the leaderboard.

## Data — the actual work

| Feature | Source | Status |
| --- | --- | --- |
| Daily sales qty per SKU × store | `order-service` (`ItemController`, `OrderReportController`) + `pos-service` | ✅ needs an aggregation view |
| Returns | `after-sales-service` | ✅ |
| On-hand / available | `stock-service` (`es-mappings/stock_open_v1.json`) | ✅ |
| In-transit / open POs | `purchase-service` | ✅ |
| Vendor lead time, MOQ, case pack | `vendor-service` | ⚠ **verify these fields are populated**, not merely modelled |
| Price + promo intensity (as covariates) | `price-service`, `promotion-service` | ✅ — **mandatory**; a forecast blind to promotions learns nonsense |
| Shelf life / expiry | `goods-service` attributes | ⚠ verify — matters for the drugstore/F&B demo segment |
| **Tet / lunar-new-year / holiday / payday calendar** | none | ❌ **`dim_calendar` must be created** |
| Store metadata (open date, format, area) | `channel-service` | ✅ |

**`dim_calendar` is non-negotiable.** Vietnamese retail demand is dominated by lunar-calendar effects.
Chronos-2's covariate support is what makes it pay off — pass Tet-proximity, holiday flags, payday flags and
promo intensity as future-known covariates, which is precisely the case where Chronos-2 gains most.
Shared with [V02](V02-ai-staff-scheduling.md): build once.

## Architecture

See `diagrams/vti-03-demand-forecast.drawio.png`.

```
Nightly (workflow-service flow)
  pgpool STANDBY ──▶ feature build
                       daily SKU × store panel
                       past covariates: price, promo intensity, returns, stockout flag
                       future-known covariates: promo calendar, holidays, Tet proximity, payday
                          ▼
                 Chronos-2 (model sidecar, CPU)
                    zero-shot quantile forecast, horizon = max(lead time) + review period
                    backtest: rolling-origin, WAPE + bias, sliced by ABC class and store format
                    baselines: naive seasonal, 4-week MA  ← nothing ships unless it beats these
                          ▼
                 ai_demand_forecast  (partitioned Postgres table; no TimescaleDB needed)
                          ▼
                 replenishment logic
                    safety stock from forecast quantile spread (P90-P50), not a flat %
                    reorder point = lead-time demand + safety stock
                    qty respects MOQ · case pack · shelf life · max shelf capacity
                          ▼
                 purchase-service  PO status = SUGGESTED
                          ▼
                 buyer reviews → approve / adjust / reject (reason captured as feedback)
                          │
  ai-service replenishment agent (MCP tools) ◀─┘
     get_forecast · list_stockout_risk · explain_suggestion · simulate_scenario
     explanation grounded on the covariate contributions + quantile bands — never re-derived
```

**Use the quantiles, don't throw them away.** Chronos-2 emits quantile forecasts; safety stock derived from
the model's own uncertainty is strictly better than a flat service-level percentage bolted on afterwards.
This is a genuinely better design than the ensemble approach and it is easy to explain on a slide.

## Build steps

**Phase 1 — data readiness check (2 days, do this FIRST)**
1. How many months of clean daily sales history exist? **<14 months means no full Tet cycle.** If short,
   pivot to a 7–14 day horizon where recent trend dominates, and say so honestly. This check decides
   whether the idea is viable at all.
2. Verify `vendor-service` lead time / MOQ are populated; verify shelf-life attributes.

**Phase 2 — feature pipeline (5 days)**
3. Reporting views on the read standby: daily panel, returns, stock snapshots, promo flags, stockout flags.
   (A stockout flag matters: censored demand looks like low demand. Mask or impute those days.)
4. `dim_calendar` seeded 2022→2028.

**Phase 3 — forecast (5 days)**
5. Chronos-2 in the model sidecar (FastAPI, pandas in / quantiles out). Batch nightly.
6. Rolling-origin backtest vs the two baselines. Report WAPE + bias by ABC class and store format.
7. Fallback path to `chronos-bolt-small` if runtime or memory is tight.

**Phase 4 — replenishment (5 days)**
8. Safety stock from quantile spread; service level per ABC class; reorder point; order-qty rounding to
   MOQ/case pack; expiry-aware caps.
9. `purchase-service`: `SUGGESTED` state + approve/adjust/reject with reason.

**Phase 5 — agent + UI (4 days)**
10. MCP tools in `ai-service`. Explanations from the covariate contributions and quantile bands.
    Tier 0 (`qwen3.5:4b`) writes the Vietnamese narrative from a structured input; escalate to MiniMax only
    for open-ended buyer questions.
11. Buyer dashboard: stockout risks ranked by lost-revenue estimate, actual-vs-forecast chart with bands.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Insufficient history** | Phase 1 gate. Short history → short horizon, stated plainly. |
| **Censored demand** (stockouts read as zero demand) | Stockout flag + mask/impute. This is the most common silent killer of retail forecasts — call it out in the pitch, it signals you've done this before. |
| Promotion spikes swamp base demand | Promo intensity as an explicit covariate; report accuracy separately for promo vs non-promo days |
| Chronos-2 leaderboard optimism | Our own rolling-origin backtest is the only number quoted |
| Long tail / intermittent demand | Intermittent series need different treatment (Croston-style or aggregate-then-disaggregate). Segment by ABC/XYZ and report separately rather than averaging the failure away. |
| Buyers don't trust it | Suggest-never-execute. Override rate as the trust KPI. |
| Nightly runtime | Runs against the standby; slowness never touches production traffic. Batch by store. |
| Scope creep into allocation / transfers / assortment | Hard line: PO suggestions only. |

## Demo script (3.5 minutes)

1. Buyer dashboard: top 20 stockout risks before Tet, ranked by estimated lost revenue.
2. Open one SKU: actual vs forecast with P10–P90 band; last Tet's spike visible and anticipated.
3. Ask *"tại sao đề xuất 400 thùng?"* → lead time 14d, forecast P70 26/day, safety stock from the band,
   MOQ 50, on-hand 90. Every number traceable to a service.
4. *"nếu tuần sau giảm giá 20% thì sao?"* → change the promo covariate, re-forecast live, suggestion changes.
   **This is the Chronos-2 payoff** — covariates make what-if actually work instead of being a guess.
5. Approve → real PO in `purchase-service`.
6. Accuracy slide: WAPE vs naive-seasonal, per ABC class, plus the honest note about intermittent SKUs.

## Effort

~21 dev-days. Do this together with [V02](V02-ai-staff-scheduling.md) — they share `dim_calendar`, the
standby views and the Chronos-2 sidecar.
