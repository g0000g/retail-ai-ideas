# I06 — AI governance & impact measurement

> **Sources:** NetSuite (*review AI decisions*, *measure real business impact*, *protect privacy*,
> *maintain recommendation quality*, *connect promotions with available inventory*) ·
> Innowise (*ethical AI and data privacy*) · IBM (CV compliance: notice, legal basis, privacy impact
> assessment) · Forbes/SAP (*investment in both technology and people*) — **3/8 sources explicitly, and it is
> the only theme that appears in every source's list of blockers**
> **Local model:** none required · **MiniMax:** no · **New infra:** none · **GPU:** none
> **Effort:** S–M (~9 days) · **Verdict:** ⭐ **the differentiator**

## Pitch

Not one of the eight sources says the blocker to retail AI is model accuracy. They say it is:

- *review AI decisions* — can a human see why the system did that, and overturn it?
- *measure real business impact* — did it actually make money, or did the number move anyway?
- *maintain recommendation quality* over time
- privacy, notice, and legal basis
- *connect promotions with available inventory* — i.e. AI decisions that contradict each other

This plan builds the thin layer that answers all five, once, for **every AI feature across all three plan
folders**.

## Four components

### 1 · Decision registry — every AI decision is a row

```sql
ai_decision(
  id, feature,              -- 'price_recommendation' | 'markdown' | 'assortment_delist' |
                            -- 'po_suggestion' | 'roster' | 'return_risk' | 'reco' | 'chat_answer' …
  subject_type, subject_id, -- sku / order / employee-id / customer-id / batch
  decision,                 -- the structured recommendation
  inputs_hash, model_name, model_version, prompt_version,
  confidence, top_factors,  -- SHAP factors, binding constraint, retrieved citations
  tier,                     -- 0 local | 2 MiniMax  (from V12)
  human_action,             -- APPROVED | REJECTED | EDITED | AUTO
  human_reason, actor, ts,
  outcome_measured_at, outcome  -- filled in later by the measurement job
)
```

One table, written by every feature. It makes four questions answerable that are otherwise guesswork:

- *Why did the system recommend that?* → `top_factors` + `model_version` + `inputs_hash`
- *How often do humans override it?* → override rate per feature, trended. **The single best trust KPI in
  any of the three folders**, and it costs nothing to collect.
- *Which model version made this decision?* → reproducibility when someone disputes a price six weeks later
- *Did it work?* → `outcome`

### 2 · Impact measurement — holdouts, not before/after

**Before/after comparison is not measurement.** Tet moves, a competitor opens, weather changes. Every
number quoted in the eight sources is a vendor's before/after.

The rule for this submission: **every AI feature ships with a holdout.**

| Feature | Unit of randomisation | Metric |
| --- | --- | --- |
| [I01](I01-price-markdown-optimization.md) pricing | store × category | margin per unit, units |
| [I02](I02-expiry-markdown-waste.md) markdown | store | write-off value, margin recovered |
| [I03](I03-assortment-space-planogram.md) assortment | store cluster subset | **category** contribution (not SKU sales) |
| [I04](I04-returns-prediction-prevention.md) size guidance | session | return rate, conversion |
| [V05](../ai-contest-retail-vti/V05-personalization-loyalty.md) recommendations | customer | AOV, conversion, revenue/visitor |
| [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md) forecast | SKU × store | WAPE vs baseline, stockout rate, stock cover |
| [V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) rostering | store | labour cost %, coverage gap minutes |
| [V07](../ai-contest-retail-vti/V07-document-ai-procurement.md) document AI | invoice stream | minutes/invoice, auto-approval rate, error rate |

Plus the honest statistics: pre-registered primary metric, minimum detectable effect, a stopping rule, and
confidence intervals on everything. **A result reported without a CI is a claim, not a measurement.**

Where randomisation is impossible (a nightly forecast affects everything), use a **backtest against the
production baseline** and say that's what it is.

### 3 · Model & data register

One table, one page, listing every model in production:

`model | version | source URL | licence | commercial use Y/N | where it runs (tier 0/2) | data it sees | owner | approved by | date`

This is where the licence work from the VTI set lands — RT-DETRv2 Apache-2.0, ByteTrack MIT, Chronos-2
Apache-2.0, bge-m3 MIT, MiniMax-M2.5 via API, **and the deliberate exclusions**: Ultralytics YOLO (AGPL-3.0,
network clause), InsightFace weights (non-commercial), FLUX Kontext Dev (non-commercial), MiniMax-M2.7
(Modified-MIT). See [`../ai-contest-retail-vti/00-model-stack.md`](../ai-contest-retail-vti/00-model-stack.md) § 10.

Plus the data-residency table: which field classes may reach tier 2, enforced by the PII scrubber and the
OPA rule from [V12](../ai-contest-retail-vti/V12-local-model-gateway.md) — not by a note in a prompt.

### 4 · Consistency guard — "connect promotions with available inventory"

NetSuite's phrasing points at a real failure mode: **AI features contradicting each other.**

| Contradiction | Guard |
| --- | --- |
| Promotion pushes a SKU that is out of stock | Offer activation checks `stock-service` availability |
| [I01](I01-price-markdown-optimization.md) raises a price while [I02](I02-expiry-markdown-waste.md) marks the batch down | Markdown wins for dated stock; encoded as a precedence rule |
| [V05](../ai-contest-retail-vti/V05-personalization-loyalty.md) recommends a SKU [I03](I03-assortment-space-planogram.md) is delisting | Recommendation filter reads the assortment plan |
| [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md) orders stock for a delisted SKU | PO suggestion checks assortment status |
| Two offers stack into a negative margin | Promotion engine already evaluates combinations — check margin floor before activation |

Implementation: a small **precedence + compatibility rule set** evaluated before any AI recommendation is
activated, with conflicts written to the decision registry as `REJECTED — conflict with X`. Cheap, and it
prevents the class of embarrassment that happens live on stage.

## Architecture

See `diagrams/industry-06-governance.drawio.png`.

```
every AI feature (N-*, V-*, I-*)
        │  writes
        ▼
   ai_decision  ──────────────────────────────┐
        │                                      │
        ├─▶ consistency guard  (precedence + compatibility rules)
        │        conflict → REJECTED, reason recorded
        │                                      │
        ├─▶ human review UI                    │
        │      why · factors · override + reason
        │                                      │
        └─▶ measurement job (nightly)          │
               joins decisions to outcomes,    │
               computes treated vs holdout,    │
               CIs, override rate, drift       │
                          ▼                    ▼
              Grafana (LGTM already deployed)  ·  model & data register (one page)
                 per-feature scorecard:
                 override rate · measured impact + CI · decision volume ·
                 tier mix + cost (from V12) · calibration drift
```

Everything here rides on infrastructure that already exists: Postgres, the pgpool standby, OTel/LGTM,
OPA, and the metering already specified in [V12](../ai-contest-retail-vti/V12-local-model-gateway.md).
**No new services.**

## Build steps

1. **(2 days)** `ai_decision` table + a tiny Java client in `core-components` so every service writes to it
   in one line. Flyway migration — ⚠ under Spring Boot 4 a missing `spring-boot-flyway` module makes
   migrations **silently skip**.
2. **(1 day)** Retro-fit the write into whichever features exist at that point. One line each.
3. **(2 days)** Holdout assignment service: deterministic hash-based assignment by unit
   (store / customer / session / SKU×store), stable across runs, with the assignment recorded on the decision.
4. **(2 days)** Nightly measurement job: join decisions to outcomes, treated vs holdout, effect size + CI.
5. **(1 day)** Grafana scorecard: one row per AI feature — override rate, measured impact + CI, volume,
   cost, calibration.
6. **(1 day)** Consistency guard rule set + conflict logging.
7. **(1 day)** Model & data register page + the licence and residency tables.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Holdouts are politically unpopular** ("why would we deliberately not use the good thing?") | Frame as: without a holdout, nobody can defend the investment at budget time. Keep holdouts small (10–20%) and rotate them. |
| Not enough volume to detect an effect | Pre-compute minimum detectable effect per feature. If MDE > plausible effect, say the feature is **not measurable at this scale** rather than fabricating a number. That admission is itself credible. |
| Measurement job becomes a data-science project | Effect size + CI on one pre-registered primary metric. No causal-inference framework, no sequential testing, no dashboards of dashboards. |
| Registry becomes write-only | The Grafana scorecard is the forcing function — one row per feature, visible weekly |
| Contradicts an existing audit/log table | Check for one first; extend rather than duplicate. `OperateLogController` exists in order-service. |
| Governance perceived as bureaucracy | Total: one table, one job, one dashboard, one page. ~9 days. Cheaper than any feature it governs. |

## Demo script (2.5 minutes — use it as the closer)

1. Feature scorecard in Grafana: 7 AI features, each with decision volume, **override rate**, measured
   impact **with a confidence interval**, and cost.
2. Point at one: *"pricing recommendations, 1,240 decisions, 18% override rate falling week over week,
   measured +3.1% margin per unit (CI 1.2–5.0) versus holdout stores."* **Our number, with error bars.**
3. Point at another honestly: *"personalization: effect not yet distinguishable from zero at this volume —
   here is the minimum detectable effect and when we'll know."* Judges trust the deck more after this slide,
   not less.
4. Open one decision: inputs, model version, top factors, the human who overrode it and why.
5. Show the consistency guard blocking a promotion on an out-of-stock SKU — NetSuite's exact challenge,
   answered.
6. Model & data register: every model, its licence, and **the four we deliberately did not use, with the
   reason**.

## Effort

**~10 dev-days**, and it upgrades every other plan in all three folders from a claim to a measurement.
If only one item from this folder is built, build this one.
