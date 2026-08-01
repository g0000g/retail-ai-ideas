# V08 — HQ ↔ branch & ERP reconciliation agent

> **VTI source:** "HQ & Branch Synchronization", "Odoo ERP Consulting & Implementation", "Retail ERP Optimization", "Finance and procurement management"
> **Local model:** `qwen3.5:4b` + deterministic rules · **MiniMax:** rarely (root-cause narratives)
> **New infra:** none · **GPU:** none · **Effort:** M (~3 weeks) · **Verdict:** high — and unusually well-supported by what's already running

## Pitch

Master data and transactions drift between HQ, stores and the ERP. Today someone finds out at month-end.

This idea makes the drift **continuously visible and explainable**: a reconciliation agent that diffs
entities across systems, classifies each discrepancy by root cause, ranks by financial impact, and proposes
the fix — for a human to approve.

## Why this monorepo is an unusually good host

`scripts/docker-compose.yml` already runs **`odoo`** (with `scripts/odoo-seed`) and
**`sqlserver-nav2022`** (Dynamics NAV). Those are not hypothetical integration targets — they are running
containers with data in them. A reconciliation demo across *three real systems* (our services, Odoo, NAV) is
something almost nobody can stand up in a contest timeframe.

Add: Kafka + Debezium CDC for change streams, Apicurio for event schemas, pgpool standby for cheap reads,
and `workflow-service` for the orchestration. Every component the idea needs is deployed.

## What gets reconciled

| Domain | Our source | Counterpart | Typical drift |
| --- | --- | --- | --- |
| SKU master | `goods-service` | Odoo product / NAV item | new SKU not propagated; unit-of-measure mismatch; barcode on one side only |
| Category / hierarchy | `goods-service` | Odoo category | renamed on one side |
| Price | `price-service` | Odoo pricelist / NAV | effective-date confusion — the #1 cause |
| Stock on hand | `stock-service` | Odoo quant / NAV | in-transit counted twice; adjustment posted on one side |
| Vendor master | `vendor-service` | Odoo partner | duplicate vendor, tax code (MST) mismatch |
| PO / receipt | `purchase-service` | Odoo PO | partial receipt handled differently |
| Sales / revenue by store | `order-service`, `pos-service` | ERP GL | timezone/cut-off boundary, POS offline batch not yet synced |
| Customer master | `customer-service` | Odoo partner | duplicates from phone-vs-email identity |

## Architecture

```
Continuous + nightly (workflow-service flow)
  ┌ our platform ─── pgpool STANDBY (goods, price, stock, order, purchase, vendor, customer)
  ├ Odoo ────────── XML-RPC / SQL read
  └ NAV ─────────── SQL Server read
                          ▼
              normaliser: canonical keys
                 SKU code · barcode · vendor MST · store code · date in one timezone
                          ▼
              deterministic diff engine  (NOT a model)
                 missing on A · missing on B · value mismatch · duplicate ·
                 stale (older than the sync SLA)
                          ▼
              classifier: root cause
                 rules first (covers most cases: effective-date, timezone cut-off,
                 UoM factor, in-transit double count, offline batch pending)
                 unexplained → qwen3.5:4b proposes a cause from the evidence bundle
                          ▼
              impact scoring: VND exposure, affected orders, affected stores
                          ▼
              reconciliation queue (back-office)
                 discrepancy · evidence from both sides · proposed fix · impact
                 → human approves → fix applied via the OWNING service's API
                          ▼
              ai-service tools: explain_discrepancy · list_top_exposure · simulate_fix
```

**The diff is deterministic and the fix is human-approved.** The model's only jobs are (a) proposing a root
cause for the residue the rules can't explain, and (b) writing the Vietnamese explanation. It never edits
data. Fixes always go through the owning service's API — never a direct write to Odoo or NAV tables.

**Rules before model, always.** Most retail reconciliation drift has a handful of boring causes. Encode
those as rules, measure what fraction they explain, and only send the remainder to a model. Reporting
"rules explained 78%, model proposed causes for the remaining 22%, human confirmed 81% of those" is a much
stronger result than "we asked an LLM".

## Timezone and cut-off: name it explicitly

The single most common false discrepancy in retail-ERP reconciliation is a **date-boundary artefact**:
sales after 23:00 local, a POS offline batch synced the next morning, an ERP posting date in UTC. Normalise
every timestamp to one store-local business date **before** diffing, and make the "pending offline batch"
state a first-class exclusion rather than a discrepancy. Getting this right is what separates a useful tool
from one that cries wolf every morning.

The POS offline sync is already a live, non-trivial mechanism here — its pending state is queryable, so use
it rather than guessing.

## Build steps

1. **(3 days)** Read adapters: Odoo XML-RPC, NAV SQL Server, our standby views. Read-only credentials only.
2. **(3 days)** Canonical key normaliser + timezone/business-date normalisation + UoM factor handling.
3. **(4 days)** Diff engine per domain, starting with **price** and **stock** (highest financial exposure).
4. **(3 days)** Rule-based root-cause classifier + the "explained %" metric. This metric *is* the project's
   scoreboard.
5. **(2 days)** Impact scoring in VND + ranking.
6. **(3 days)** Reconciliation queue UI: side-by-side evidence, proposed fix, approve/reject with reason.
7. **(2 days)** Fix application through owning-service APIs; full audit trail.
8. **(2 days)** `ai-service` tools + Vietnamese narrative for unexplained cases (tier 0; escalate to
   MiniMax-M2.5 only for genuinely multi-factor cases).

## Risks

| Risk | Mitigation |
| --- | --- |
| **Read-only access to Odoo/NAV is not guaranteed in real deployments** | The containers here are ours, so the demo works. For the pitch, be explicit that production needs a read replica or an integration user — that's an operational ask, not a technical unknown. |
| Alert fatigue from false discrepancies | Timezone/cut-off/UoM/in-transit handled *before* diffing; pending-offline-batch excluded; tolerance thresholds per domain. Track false-positive rate and report it. |
| A "fix" makes things worse | Human approval, owning-service APIs only, full audit, and a dry-run `simulate_fix` before applying |
| Volume: millions of rows nightly | Diff on hashes/checksums per entity, not full row compares; incremental via Debezium CDC where available |
| Model invents a plausible-but-wrong root cause | Model output is a *hypothesis* labelled as such, with the evidence attached, and a human confirms. Track confirmation rate — if it's low, the model isn't earning its place. |
| Scope creep into an iPaaS / MDM project | Line: detect, explain, propose, human-apply. No bidirectional auto-sync, no master-data governance workflow. |

## Demo script (3 minutes)

1. Reconciliation dashboard: 47 open discrepancies, ranked by VND exposure. Top one: a price mismatch
   between `price-service` and Odoo worth 12M VND of exposure across 3 stores.
2. Open it: side-by-side evidence, root cause **"effective-date mismatch — Odoo pricelist applied from 01/07,
   ours from 25/06"**, proposed fix, affected orders listed.
3. Approve → fix applied through `price-service`, audit entry written, discrepancy closes.
4. Show a discrepancy the rules **correctly dismissed**: sales gap explained by a POS offline batch still
   pending sync. *"This is not a problem, and here's why"* is as valuable as finding one.
5. Show one unexplained case → the model's hypothesis with its evidence bundle, clearly labelled as a
   hypothesis.
6. Slide: discrepancies found, % explained by rules vs model, total VND exposure surfaced, false-positive rate.

## Effort

~22 dev-days. Steps 1–3 on price + stock only (10 days) already demo well, because price and stock drift is
where the money is.
