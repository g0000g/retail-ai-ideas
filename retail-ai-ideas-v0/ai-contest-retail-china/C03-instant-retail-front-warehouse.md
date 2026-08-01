# C03 — 即时零售 / 前置仓: 30-minute fulfilment allocation

> **Reading:** 📘 PLAYBOOK · **Effort:** M–L (~4 weeks) · **GPU:** none · **Verdict:** ⭐ ¥1T market, and the pattern is already arriving in Vietnam

## Why this

| Evidence | Source |
| --- | --- |
| Instant retail **> ¥800B in 2025 → > ¥1T in 2026** (Zhongshang); **> $278.9B by 2030**, front warehouses driving most new demand | [EqualOcean](https://equalocean.com/analysis/2025072821618), [BXTData](https://www.bxtdata.com/en/insights/7927/Meituan%20Flash%20Shopping%20Front%20Warehouse%20Strategy:%20How%20Instant%20Retail%20is%20Reshaping%20China%20FMCG) |
| **3km fulfilment radius is Meituan's structural advantage**; 5,000+ 闪电仓; **50,000+ front warehouses nationwide in 2026**, density +40% | same |
| **150 million instant-retail orders in a single day** (Meituan, 12 July); Alibaba+Ele.me 80M+ daily | [Real Time Mandarin](https://www.realtimemandarin.com/p/233-online-platforms-compete-for) |
| The subsidy war costs: Alibaba **−¥41B**, JD **−¥26B**, Meituan **−¥25B EBIT** for the 12 months to June 2026 | [China Digital Retail Report](https://chinadigitalretailreport.substack.com/p/media-instant-retail-2026-from-discounts) |
| Meituan completed the **Dingdong Maicai acquisition 5 Feb 2026** — consolidation phase | same |

**The lesson from those loss numbers:** the platforms are burning cash on *subsidies*. The durable
advantage is **fulfilment cost per order**, and that is decided by three algorithmic choices — what to
stock in each 3km warehouse, which warehouse serves each order, and how orders batch onto riders.

That is a solved class of optimisation problem, on CPU, with Apache-2.0 tooling.

## The three decisions

### 1 · Assortment per front warehouse (what to stock in 3km)
A 前置仓 holds maybe 2,000–5,000 SKUs out of a 50,000-SKU catalogue. Which ones?
- demand at **3km × 30-minute** granularity — this is [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md)'s
  Chronos-2 forecast at a much finer grain, with the same covariates plus **weather, daypart and local events**
- constrained by physical shelf/freezer capacity, shelf life, and pick-time-per-SKU
- **demand transference matters more here than in a full store**: if a shopper can't get brand A in 30
  minutes they take brand B, they don't wait. Reuse the transference work from
  [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md).

### 2 · Sourcing decision per order (which warehouse serves it)
Given an order, choose the fulfilment point that meets the promise at the lowest cost:
stock availability × distance × current rider load × the risk of a split shipment.
**A split order in instant retail is usually worse than a substitution** — two riders, two arrival times.

### 3 · Batching and dispatch
Which orders ride together, in what sequence. OR-Tools VRP with **hard 30-minute time windows**, which is
a much tighter constraint than the day-level routing in
[I08](../ai-contest-retail-industry/I08-delivery-route-optimization.md) — and therefore a *smaller,
easier* problem per solve, because the feasible set is small.

## Architecture

See `diagrams/china-03-instant-retail.drawio.png`.

```
NIGHTLY
  pgpool STANDBY ──▶ 3km-cell demand panel
                       SKU × warehouse × 30-min slot
                       covariates: weather · daypart · promo · 节假日 (春节/618/双11) · local events
                          ▼
                Chronos-2 (Apache-2.0, 120M, CPU, covariate-aware)
                          ▼
                assortment optimizer (OR-Tools)
                  capacity · shelf life · pick time · transference
                          ▼
                replenishment plan per 前置仓 → purchase-service / transfer orders

REAL TIME  (per order, must answer in tens of milliseconds)
  order in → sourcing decision
     candidate warehouses within radius × stock × rider load × split risk
     → deterministic scoring, precomputed distance matrix. NOT a model call.
                          ▼
  batching window (rolling, seconds)
     OR-Tools VRP, hard 30-min windows, rider capacity
                          ▼
  dispatch → rider app → ETA → customer
                          ▼
  actuals → recalibrate: pick time per SKU, travel time per cell per daypart
```

**The real-time path contains no LLM call.** Sourcing is a scored lookup over a precomputed matrix;
batching is a solver with a seconds-level budget. An LLM in a 30-minute-promise hot path is an outage
waiting to happen. The LLM's role here is offline: explaining the plan to an operator, and answering
"why did this order come from warehouse B?".

## Sample repos & components

| Component | Repo / tool | Licence |
| --- | --- | --- |
| Forecasting | [autogluon/chronos-2](https://huggingface.co/autogluon/chronos-2) | Apache-2.0 |
| Optimisation (assortment + VRP) | [google/or-tools](https://github.com/google/or-tools) | Apache-2.0 |
| Road distance / ETA | [Project-OSRM/osrm-backend](https://github.com/Project-OSRM/osrm-backend) | BSD-2 |
| Explanation agent | [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | Apache-2.0 |
| Demand transference input | [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) | — |

Existing services used unchanged: `stock-service` (per-warehouse stock), `order-service`
(`O2oFulfillmentController`, `DeliveryLogController`), `channel-service` (warehouses as locations),
`purchase-service` (replenishment).

## What has to be created

| Missing | Cost |
| --- | --- |
| **前置仓 as a location type** with capacity, freezer/ambient zones, pick-time model | ~2 days of modelling |
| **3km cell grid** + cell↔warehouse mapping | ~1 day |
| **Rider/fleet model** — shift, capacity, current load | ~2 days |
| Weather + local-event feed as covariates | ~2 days, and worth it: weather is a first-order driver of instant-retail demand |
| Precomputed distance/duration matrix per cell | OSRM, ~1 day |

## Build steps

1. **(2 days)** Viability check: does the business actually run own warehouses/riders, or is fulfilment
   3PL? If pure 3PL, the batching half collapses to carrier selection — same gate as
   [I08](../ai-contest-retail-industry/I08-delivery-route-optimization.md).
2. **(4 days)** Location/capacity/rider data model + 3km cell grid + OSRM matrix.
3. **(5 days)** Slot-level demand panel with weather/daypart/event covariates; Chronos-2 forecast.
   Baselines first: same-slot-last-week and 4-week average. Nothing ships that doesn't beat them.
4. **(5 days)** Assortment optimizer per warehouse under capacity + shelf life + transference.
5. **(4 days)** Real-time sourcing scorer + precomputed matrices; load test it — **latency is the feature**.
6. **(4 days)** Batching VRP with hard 30-min windows; intraday re-solve for unassigned orders only.
7. **(3 days)** Operator console + `explain_sourcing` / `simulate_assortment` agent tools.
8. **(3 days)** Measurement per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):
   **fulfilment cost per order** (the metric that actually decides who wins), on-time rate, split rate,
   out-of-stock-substitution rate, orders per rider hour. Holdout by warehouse or by day.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No own fleet / no front warehouses** | Week-1 gate with a defined pivot (carrier selection + sourcing only) |
| Real-time latency budget blown | No model calls in the hot path; precomputed matrices; load test in phase 5 |
| Forecast at 3km × 30min is very sparse | Aggregate to hourly and to cell clusters for low-volume cells; use quantiles, staff/stock to P70 not the mean |
| Weather feed dependency | Start with a free public feed; degrade to seasonal averages if it fails — never let a forecast job block on an external API |
| Substitution annoys customers | Offer the choice at order time when stock is thin, rather than substituting silently at pick time |
| Chasing the platforms' subsidy war | **Out of scope, explicitly.** We optimise cost per order; we do not model subsidy strategy. The ¥41B/¥26B/¥25B losses are the argument for that boundary. |
| Scope creep into a full WMS/TMS | Line: assortment plan, sourcing decision, batching, ETA. No warehouse task management, no carrier contracts. |

## Demo script (3.5 minutes)

1. Map of 3km cells around three front warehouses, with tomorrow's forecast heat by daypart.
2. Assortment plan for one warehouse: 2,400 of 50,000 SKUs, with the binding constraint shown
   (freezer capacity) and three SKUs kept only because of transference.
3. Place an order → sourcing decision in milliseconds, with the reason (nearest warehouse lacked one line;
   chose the second to avoid a split).
4. Batch three orders onto one rider inside the 30-minute window; add a fourth mid-window → re-solve for
   unassigned only.
5. Ask the agent *"为什么这单从B仓发货？"* → grounded answer citing stock, distance and split risk.
6. Slide: **fulfilment cost per order**, treated vs control days.

## Effort

~30 dev-days, and the most infrastructure-dependent plan in this folder. Do the week-1 gate first.
