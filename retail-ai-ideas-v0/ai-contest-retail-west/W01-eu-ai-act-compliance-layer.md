# W01 — EU AI Act compliance layer (multi-jurisdiction)

> **Driver:** EU AI Act · Colorado AI Act (1 Jun 2026) · CCPA-ADMT · **Effort:** M (~3 weeks) · **Verdict:** ⭐ the differentiator

## Why this is the first thing to build in the West

Three facts from [`00-west-regulation.md`](00-west-regulation.md):

1. *"Over half of organizations lack systematic AI inventories."* You cannot classify what you have not
   listed, and classification is the gate on everything else.
2. **Article 26 requires operational controls and automatic event logging** — *"policy statements and
   documented intent do not satisfy these requirements."* This is an engineering obligation, not a policy one.
3. **Penalties up to €35M or 7% of global revenue**, and **GPAI enforcement powers switch on 2 August 2026**.

And the reason it is cheap for us: **[I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md)
already built most of it** for entirely different reasons — because every industry source said governance,
not accuracy, was the blocker.

## The mapping that makes this a 3-week plan instead of a 3-month one

```
EU AI Act Article 26 obligation          →  what we already run
─────────────────────────────────────────────────────────────────────────
automatic event logging, retain ≥6 months →  ai_decision (I06) — extend retention
operational human-oversight controls      →  I06 human_action + OPA gate (N-12), fail closed
technical documentation                   →  model & data register (I06 §3) + MLflow
discriminatory-impact monitoring          →  Evidently slice metrics on the I06 scorecard
worker notification                       →  NEW — a UI surface + a record  (W07)
FRIA where required                       →  NEW — a versioned document with an owner
incident reporting 24h / 72h / 15d        →  NEW — one record, three routes
AI system inventory + risk classification →  NEW — the first deliverable
```

**Four new things, four existing things extended.** That is the whole plan.

## Component 1 — AI system inventory and risk classification

```sql
ai_system(
  id, name, owner, jurisdiction[],          -- EU · CO · CA · VN · CN
  purpose, deployment_status,
  role ENUM('deployer','provider'),         -- ⚠ see the provider trap below
  risk_class ENUM('prohibited','high','limited','minimal'),
  classification_rationale, classified_by, classified_at,
  annex_iii_category,                       -- e.g. 'employment_worker_management'
  model_refs[], data_categories[],
  human_oversight_mechanism, log_retention_days,
  fria_ref, last_reviewed_at
)
```

Seed it by walking the other five folders. Indicative first pass:

| Feature | Likely class | Why |
| --- | --- | --- |
| [V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md) staff scheduling / task allocation | **HIGH (Annex III employment)** | worker management, task allocation, performance monitoring |
| Warehouse pick-rate monitoring | **HIGH** | performance monitoring of workers |
| CV screening for seasonal hiring | **HIGH** | recruitment and selection |
| Any staff emotion/sentiment inference | **PROHIBITED** | absolute ban since Feb 2025 |
| [N-01](../ai-contest-retail/01-retail-copilot-mcp.md) / [C07](../ai-contest-retail-china/C07-chinese-service-guide-agent.md) customer chat | **LIMITED** | Art. 50 transparency — disclose it is AI |
| [N-02](../ai-contest-retail/02-catalog-enrichment.md) / [C04](../ai-contest-retail-china/C04-content-factory-douyin-xiaohongshu.md) generated content | **LIMITED** | content marking, 2 Dec 2026 |
| [I01](../ai-contest-retail-industry/I01-price-markdown-optimization.md) pricing · [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md) forecast · [I05](../ai-contest-retail-industry/I05-product-data-quality.md) data quality | **minimal** | no natural-person impact |
| [I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md) returns risk · [N-10](../ai-contest-retail/10-return-fraud-detection.md) abuse scoring | **⚠ review** | consumer-affecting scoring — advisory-only design helps, but get it classified, don't assume |

⚠ **Classification is a legal call, not an engineering one.** The table above is a *first pass to give
counsel something to correct*, which is exactly what makes it useful.

## Component 2 — the provider trap

> *"An organisation that substantially modifies an existing AI system or adapts it for a specific
> high-risk purpose becomes the provider in legal terms, and full responsibility for technical
> documentation and conformity assessment shifts to that organisation."*

Fine-tuning an open model for scheduling could flip us from deployer to **provider** — a far heavier
obligation. So:

```sql
ai_system_modification(
  system_id, ts, actor,
  kind ENUM('fine_tune','prompt_change','tool_added','data_change','purpose_change','threshold_change'),
  description, base_model_ref, artifacts_ref,
  provider_status_reviewed BOOLEAN, reviewed_by
)
```

Every substantial change writes a row, and a change of `kind='purpose_change'` or `'fine_tune'` **raises a
review flag**. Cheap insurance against the single most expensive misclassification available.

## Component 3 — one incident, three clocks

> *"Following an AI-related incident, an organisation often has to report within three different
> timeframes: **24 hours for NIS2, 72 hours for GDPR and fifteen days for the AI Act**."*

```
incident detected  (from ai_decision, robot_incident (R10), guardrail block, or a human report)
        ▼
  ai_incident record — one source of truth
     what · when · which systems · which data categories · affected parties · severity
        ▼
  ┌──────────────┬──────────────┬──────────────┐
  ▼              ▼              ▼              ▼
NIS2 24h      GDPR 72h      AI Act 15d     internal review
(if in scope) (if PI)       (if high-risk)
  each with its own template, recipient, owner and a countdown timer
```

**The countdown timers are the feature.** An incident record with three visible clocks is the thing that
stops a 24-hour deadline being missed while someone drafts the 15-day one.

## Component 4 — transparency and content marking

Two dated obligations, one mechanism, already specified for China:

| Obligation | Date | Implementation |
| --- | --- | --- |
| **Art. 50 transparency** | 2 Aug 2026 | persistent "AI assistant" disclosure on chat surfaces; disclosure in the interaction, not buried in a policy |
| **Content marking** | 2 Dec 2026 | provider identifier + content ID **minted at generation**, persisted in `ai_decision` |

**Identical pattern to China's 标识办法** ([`00-china-compliance.md`](../ai-contest-retail-china/00-china-compliance.md) §1).
Build one content-marking mechanism, satisfy both regimes. That is a genuinely strong slide.

## Build steps

1. **(1 day)** ⚠ **Check whether the Digital Omnibus was formally adopted before 2 Aug 2026.** Yes → the
   employment high-risk deadline is Dec 2027. No → the original timeline applies. One lookup, 16 months.
2. **(3 days)** `ai_system` + `ai_system_modification` tables + the back-office inventory UI. Seed from the
   six folders.
3. **(2 days)** First-pass classification with the table above; route to counsel for correction; record the
   rationale, the classifier and the date.
4. **(2 days)** Extend `ai_decision` retention to ≥6 months for high-risk systems; add `ai_system_id`.
5. **(3 days)** `ai_incident` + the three-clock router with countdown timers and per-regime templates.
6. **(2 days)** Content-marking + Art. 50 disclosure — one mechanism, EU and CN.
7. **(2 days)** Discriminatory-impact monitoring: Evidently slice metrics wired onto the I06 scorecard.
8. **(2 days)** **Emotion-recognition audit** — grep the estate for sentiment/emotion inference applied to
   staff. Remove anything found; record that the audit happened and what it covered.
9. **(1 day)** Compliance dashboard: systems by risk class, FRIA status, log-retention conformance, open
   incidents with their clocks, unreviewed modifications.

## Risks

| Risk | Mitigation |
| --- | --- |
| **We classify something wrong** | First pass is engineering, final call is counsel; rationale and classifier recorded so a wrong call is traceable and correctable |
| Treated as paperwork | It is ~15 days and it is the only thing here with a €35M/7% number attached. Frame it as the licence to deploy anything else. |
| **The Omnibus is not adopted and August 2026 arrives** | Step 1 checks it. If not adopted, W07's obligations become urgent rather than 2027 work. |
| Inventory rots | Every new AI feature writes an `ai_system` row as part of its definition of done; the dashboard surfaces unreviewed rows |
| Over-classifying everything as high-risk | Costly and dilutes the signal. Classify honestly; most retail AI is minimal-risk. |
| Jurisdiction drift (Colorado, CCPA, more states) | `jurisdiction[]` is an array from day one; one control layer, several regimes |
| Duplicating an existing audit table | `OperateLogController` exists in order-service — check and extend rather than duplicate |

## Demo script (3 minutes — this is the closer)

1. **AI system inventory**: 14 systems, classified, with jurisdiction tags. Over half of organisations
   don't have this page.
2. Open the **high-risk** one (V02 scheduling): its Article 26 evidence in one view — human oversight
   control, log retention, FRIA reference, discriminatory-impact slices, worker-notification record.
3. Change a prompt on a high-risk system → **`ai_system_modification` row raises a provider-status review
   flag.** Explain the trap in one sentence.
4. Trigger a simulated incident → **one record, three countdown clocks** (24h NIS2, 72h GDPR, 15d AI Act),
   each with its template and owner.
5. Show the **emotion-recognition audit** result: what was searched, what was found, what was removed.
6. Show that the **same content-marking mechanism** satisfies EU Art. 50/content marking **and** China's
   标识办法. One build, two regimes.

## Effort

~18 dev-days, and it upgrades every other plan in six folders from *"we built an AI feature"* to
*"we built an AI feature we can defend"*.
