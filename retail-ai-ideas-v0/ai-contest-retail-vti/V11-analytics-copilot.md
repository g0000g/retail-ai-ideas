# V11 — Retail analytics copilot (NL → SQL → chart)

> **VTI source:** "Data analytics" (Microsoft Gold Partner for Data Analytics), "Heatmaps and customer analytics", "Performance KPI tracking"
> **Local model:** `qwen3.5:4b` + FunctionGemma 270M router · **MiniMax:** yes, for hard multi-step questions
> **New infra:** none (optional DuckDB in the sidecar) · **GPU:** none · **Effort:** M (~2.5 weeks) · **Verdict:** high

## Pitch

A store manager or category buyer types a question in Vietnamese and gets a table, a chart, and the SQL:

- *"Doanh thu cửa hàng 12 tuần trước so với tuần trước đó?"*
- *"Top 20 SKU tăng trưởng nhanh nhất tháng này ở miền Nam"*
- *"Tỷ lệ huỷ đơn theo lý do, 3 tháng, theo kênh"*
- *"SKU nào tồn kho > 90 ngày mà vẫn đang giảm giá?"*

## The two design decisions that make this safe

### 1. It reads a replica, through a read-only role, over curated views

`pgpool` CQRS read/write split is live on dev `:9999`, with `goods-service` already repointed (~97% of its
reads served by the standby). A generated-SQL agent is the ideal second consumer: read-only by construction,
tolerant of replica lag, and structurally incapable of touching the primary.

Layered defence, in order:
1. **A dedicated read-only Postgres role on the standby.** Writes are impossible by `GRANT`, not by prompt.
2. **Curated reporting views only** — not raw entity tables. `OrderReportController` implies these queries
   already exist; lift them into views with clear names and documented grain.
3. `EXPLAIN` before execute, row cap, `statement_timeout`.
4. The generated SQL is **always shown** next to the answer.

### 2. The semantic layer is the product, not the model

The reason most NL→SQL demos collapse in real use is not the model — it is that "revenue" is ambiguous
(gross? net of returns? with or without VAT? by order date or delivery date?). Fix that once, in data:

```
ai_metric(name, definition_sql, grain, unit, description_vi, description_en, owner)
   revenue_net  = sum(item_line.amount) - returns, excl. VAT, by business date, store-local
   units_sold   = sum(item_line.qty) excluding cancelled
   cancel_rate  = cancelled_orders / total_orders, by business date
   stock_days   = on_hand / trailing_28d_avg_daily_units
   ...
ai_dimension(name, column, hierarchy, description_vi)
   store → region → channel;  sku → spu → category → brand;  date → week → month
```

The model then composes **metrics × dimensions × filters**, not arbitrary SQL. That is a far smaller, far
more reliable generation task, and a 4B model can do it. It also means two people asking "doanh thu" get the
same number — which is the actual business requirement.

**Start with ~12 metrics and ~6 dimensions.** That covers most real questions and is a day of work with a
finance stakeholder.

## Architecture

```
front-end (back-office)  ──▶  back-office-bff  ──▶  ai-service  POST /v1/ai/analyze
   ├─ 1. router  FunctionGemma 270M or heuristic
   │        known-metric question | free-form SQL | not-a-data-question
   ├─ 2. resolve: metric(s) + dimension(s) + time range + filters   (tier 0, schema-constrained)
   │        ambiguity → ask, never guess ("doanh thu gross hay net?")
   ├─ 3. compose SQL from ai_metric definitions   (template assembly, not free generation)
   │        escape hatch: free-form SQL for power users, tier 2, EXPLAIN-gated
   ├─ 4. execute on pgpool STANDBY, read-only role, row cap, timeout
   ├─ 5. chart spec chosen from the result shape
   │        1 metric over time → line;  metric by category → bar;  2 dims → heatmap;
   │        share of total → stacked bar (never a pie with 12 slices)
   └─ 6. one-line NL summary + the SQL + replica-lag footer
```

**Chart choice is a rule, not a model call.** Result shape determines the mark: dimensionality, cardinality
and whether the measure is a part-of-whole. This is deterministic, cheap, and produces more consistent
output than asking a model to "pick a chart".

## Where the tiers split

| Step | Tier | Why |
| --- | --- | --- |
| Intent routing | tier 0 FunctionGemma 270M | purpose-built for function calling on tiny hardware; this hop must be ~free |
| Metric/dimension resolution | tier 0 `qwen3.5:4b` | constrained choice from a known list + validator |
| SQL composition from metrics | none | template assembly |
| Free-form SQL for a novel question | **tier 2 MiniMax-M2.5** | genuine reasoning over schema; rare, so cost is fine |
| Multi-step analysis ("why did it drop?") | **tier 2** | needs planning across several queries |
| NL summary of a result | tier 0 | short, structured input |

**Residency:** aggregates are fine for tier 2; **row-level customer data is not**. Enforce it by construction —
tier 2 sees the *schema and the question*, never the result rows.

## Optional: DuckDB in the sidecar

For heavy analytical scans, export nightly Parquet snapshots to MinIO and let DuckDB (MIT) query them. Keeps
big aggregations entirely off Postgres, costs one library, and makes "3 years of order lines" queries fast on
CPU. Add it only if measurements show the standby struggling — not before.

## Build steps

1. **(1 day)** Read-only role on the standby + reporting views for the first ~12 metrics. Do this *with* a
   finance/ops stakeholder — the definitions are the deliverable.
2. **(2 days)** `ai_metric` / `ai_dimension` tables + the SQL composer + unit tests per metric (a metric with
   no test is a future argument).
3. **(2 days)** Resolution step: tier 0, schema-constrained, ambiguity → clarifying question.
4. **(2 days)** Execution guardrails: `EXPLAIN`, row cap, timeout, lag footer, SQL always displayed.
5. **(3 days)** Chart-spec rules + Angular rendering. Follow one consistent visual system across all charts —
   same palette, same axis conventions, accessible in light and dark.
6. **(2 days)** Free-form escape hatch via tier 2, clearly labelled "draft analysis", EXPLAIN-gated.
7. **(2 days)** Saved questions + scheduled digest ("mỗi thứ 2 gửi top 20 SKU tồn kho chậm") via
   `workflow-service`. Cheap, and it is what turns a demo into something people keep using.
8. **(1 day)** Multi-turn memory in Redis; per-tenant row-level filters applied **before** execution.

## Relationship to the other set

This is the **same component** as the structured retriever in
[`../ai-contest-retail/04-ops-rag-assistant.md`](../ai-contest-retail/04-ops-rag-assistant.md). Build it once
in `ai-service`. V11 adds the metric layer and charting; the other plan adds document retrieval on top. Do
not build two NL→SQL paths.

## Risks

| Risk | Mitigation |
| --- | --- |
| **A wrong number gets believed and acted on** | Metric layer with tested definitions; SQL always shown; "draft analysis" label on the free-form path; row count displayed. The metric layer is the answer to this — not prompt engineering. |
| Ambiguous business terms | Ask, don't guess. A clarifying question is a feature. |
| Replica lag confuses "hôm nay" | Lag shown in the answer footer; today-partial data flagged explicitly |
| Multi-tenant row leakage | Tenant filter injected into the view/query before execution, never as a post-filter |
| Free-form SQL performance | `EXPLAIN` gate, cost threshold, timeout, row cap. Optional DuckDB path for heavy scans. |
| Model composes a valid-but-meaningless query | Constrained to metric × dimension combinations; incompatible grains rejected by the composer, not the model |
| Chart choices that mislead | Rule-based marks; no truncated axes on bar charts; no pies beyond 4 slices |
| Scope creep into a BI product | Line: ask, answer, chart, save, schedule. No dashboard builder, no data modelling UI. |

## Demo script (3 minutes)

1. *"Doanh thu cửa hàng 12 tuần trước so với tuần trước đó?"* → number, line chart, the SQL, lag footer.
2. Ask *"doanh thu"* ambiguously → it asks gross or net, and shows the two definitions from `ai_metric`.
   **This is the slide that separates it from every other NL→SQL demo.**
3. *"Top 20 SKU tăng trưởng nhanh nhất tháng này ở miền Nam"* → bar chart, drill into one SKU.
4. *"Tại sao doanh thu cửa hàng 7 giảm tuần trước?"* → escalates to MiniMax, runs several queries, returns a
   ranked list of contributing factors — each backed by a query you can inspect.
5. Save it as a scheduled Monday digest.
6. Point out: it ran on the **read standby**, with a read-only role, and the row-level data never left the rack.

## Effort

~15 dev-days. Steps 1–4 (7 days) are a complete, safe, demoable copilot; 5–8 make it something people use
twice.
