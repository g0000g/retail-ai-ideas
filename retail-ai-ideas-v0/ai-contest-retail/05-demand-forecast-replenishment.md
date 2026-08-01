# Idea 05 — Demand forecasting & auto-replenishment agent

> **Blueprint source:** `Multi-Agent-Intelligent-Warehouse` (forecasting agent + ops coordination agent)
> **New infra:** none (CPU sklearn; RAPIDS optional) · **GPU:** none required — blueprint documents CPU fallback · **Effort:** M–L (4 weeks) · **Verdict:** high

## Pitch

Per SKU × per store/warehouse: forecast next-N-days demand, compare against on-hand + in-transit stock and
the vendor's lead time, and emit a **purchase-order suggestion** that a buyer approves in one click.
An LLM agent sits on top to explain each suggestion and answer "why are you ordering 400 of this?".

This is the idea with the clearest money attached: overstock is working capital, stockout is lost revenue,
and every retailer's buyers currently do this in Excel.

## Why it's feasible without a GPU

The blueprint's forecasting agent is an **ensemble of classical models** — Random Forest, XGBoost, Gradient
Boosting, Ridge, SVR. RAPIDS makes it 10–100× faster; it does not make it possible. On CPU, for
~10⁴–10⁵ SKU×location series with daily granularity, a nightly batch is minutes, not hours.

The LLM part (explanation, Q&A, agent tools) is hosted NIM. So: **zero GPU, zero new datastore.**

## Data — this is the real work

| Feature | Source | Availability |
| --- | --- | --- |
| Daily sales qty per SKU × store | `order-service` (`ItemController`, `OrderReportController`) + `pos-service` | ✅ but needs an aggregation view |
| Returns | `after-sales-service` | ✅ |
| On-hand / available stock | `stock-service` (`es-mappings/stock_open_v1.json`) | ✅ |
| In-transit / open POs | `purchase-service` | ✅ |
| Vendor lead time, MOQ | `vendor-service` | ⚠ verify these fields are populated, not just modelled |
| Price + promotion history | `price-service`, `promotion-service` | ✅ — **critical**: promo spikes must be a feature or the model learns nonsense |
| Calendar: Tet, holidays, paydays, school terms | none | ❌ must be created — a small table, huge accuracy impact in VN retail |
| Store metadata (open date, area, format) | `channel-service` | ✅ |

**The Tet/holiday calendar is non-negotiable.** Vietnamese retail demand is dominated by lunar-calendar
effects; a forecaster without them is worthless and will be obvious to any judge from the industry.

## Architecture

See `diagrams/idea-05-forecast-replenishment.drawio.png`.

```
Nightly (workflow-service flow)
  pgpool STANDBY ──▶ feature build (SQL → daily SKU×location panel + promo/holiday features)
                          ▼
                  Python forecast job (container, CPU)
                    ensemble: RF · XGBoost · GBM · Ridge · SVR  →  weighted blend
                    walk-forward backtest, per-series model selection
                          ▼
                  forecast + safety stock + reorder point + suggested qty
                          ▼
                  POST → purchase-service  (PO suggestion, status = SUGGESTED)
                          ▼
                  buyer reviews in front-end ──▶ approve ──▶ real PO
                          │
ai-service replenishment agent (MCP tools) ◀────────┘
   get_forecast / explain_suggestion / simulate_scenario / list_stockout_risk
```

Forecast output stored in Postgres (`ai_demand_forecast`), not a new TSDB. The blueprint uses TimescaleDB;
plain Postgres with a partitioned table is enough for daily granularity and avoids a new container.

**Python is justified here** (unlike ideas 01–04): sklearn/XGBoost have no equivalent Java story worth
fighting. One containerised batch job, triggered by `workflow-service`, writing to Postgres — it does not
join the Spring service mesh, so it costs nothing architecturally.

## Build steps

**Phase 1 — feature pipeline (7 days)**
1. Reporting views on the standby: daily sales panel, returns, stock snapshots, promo flags.
2. `dim_calendar` table: VN public holidays, lunar new year window, paydays, school terms. Seed 2022→2027.
3. Backfill 18–24 months. **If history is shorter than ~14 months the model can't see one full Tet — check
   this first, it decides whether the idea is viable at all.**

**Phase 2 — forecast model (8 days)**
4. Baselines first: naive seasonal, moving average. Every later model must beat these or it doesn't ship.
5. Ensemble per the blueprint; walk-forward backtest; metrics WMAPE + bias, sliced by ABC class and store format.
6. Per-series model selection (fast movers vs long-tail behave completely differently).

**Phase 3 — replenishment logic (5 days)**
7. Safety stock from forecast error (not a flat %), service-level target per ABC class.
8. Reorder point = lead-time demand + safety stock; suggested qty respects MOQ, case pack, shelf life.
9. `purchase-service`: `SUGGESTED` PO state + approve/reject/adjust, with the reason captured for feedback.

**Phase 4 — agent layer (6 days)**
10. MCP tools in `ai-service`: `get_forecast`, `explain_suggestion`, `list_stockout_risk`, `simulate_scenario`.
11. LLM explanations grounded on the actual feature contributions (SHAP or the tree feature importances) —
    **not** a re-derivation from the number. Grounded explanation or nothing.
12. Buyer chat: *"why 400?"*, *"what if I run a 20% promo next week?"*, *"which SKUs will stock out before Tet?"*

## Risks

| Risk | Mitigation |
| --- | --- |
| **Not enough sales history** | Verify in week 1. If <14 months, pivot to short-horizon (7–14 day) forecasting where recent trend dominates, and say so honestly. |
| New stores / new SKUs have no history | Cold-start via category × store-format averages. Explicitly flag as low-confidence. |
| Promotion effects swamp base demand | Promo intensity as an explicit feature; report accuracy separately for promo vs non-promo days |
| Buyers won't trust it | Suggest-not-execute, always. Track override rate as the trust KPI — a falling override rate is the best possible metric slide. |
| Scope creep into full IMS planning | Hold the line at PO suggestions. Allocation, transfers, assortment are all out. |
| Nightly job runtime | It reads the standby; slowness never touches production traffic |

## Demo script (4 minutes)

1. Buyer dashboard: top 20 stockout risks before Tet, ranked by lost-revenue estimate.
2. Open one SKU: actual vs forecast chart, last Tet's spike visible and correctly anticipated.
3. Ask the agent *"tại sao đề xuất 400 thùng?"* → lead time 14d, forecast 26/day, safety stock for 95%
   service level, MOQ 50, current on-hand 90 — each number traceable to a service.
4. *"nếu tuần sau giảm giá 20% thì sao?"* → re-forecast, suggestion changes.
5. Approve → real PO appears in `purchase-service`.
6. Accuracy slide: WMAPE vs the naive baseline, per ABC class.

## Effort

~26 dev-days, and the most data-dependent idea in this folder. Highest business value, highest chance of
being blocked by data quality. **Do the Phase 1 history check before committing to it as the contest entry.**
