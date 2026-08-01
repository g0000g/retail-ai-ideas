# Idea 10 — Return-abuse & order-anomaly scoring

> **Blueprint source:** `financial-fraud-detection` (GNN + Shapley), `transaction-foundation-model` (tx embeddings)
> **New infra:** none for the CPU baseline · **GPU:** 1×≥32GB for the GNN/foundation-model version · **Effort:** M · **Verdict:** medium

## Pitch

Retail fraud is not card fraud — it's **return abuse, promo abuse, and reseller/courier collusion**:

- Serial returners: high return rate, always "wrong size", always cash refund
- Wardrobing / swap fraud: returned item ≠ shipped item
- Promotion abuse: many accounts, one address/phone/device, all first-order coupons
- COD abuse: chronic refusal at the door, driving delivery cost
- Employee-assisted: POS voids/discounts clustering on one cashier

Score every order and every after-sales request; surface the top risks to CS with an **explanation**, not a
bare number.

## Why the graph framing is right for retail

The blueprint's core insight is that fraud lives in **relationships**, not in single rows. Retail's signal is
exactly that: the same phone across 40 accounts, the same address across 12 "different" customers, the same
courier on every disputed delivery. A flat per-order classifier misses all of it.

Entity graph available from existing services:

```
Customer ──┬─ phone ── shared with → Customer      (customer-service)
           ├─ address ── shared with → Customer
           ├─ places → Order → contains → SKU      (order-service)
           ├─ Order → paid via → PaymentMethod     (payment-service)
           ├─ Order → returns → AfterSaleRequest   (after-sales-service, order-service AfterSale* controllers)
           ├─ Order → delivered by → Courier       (order-service DeliveryLogController)
           └─ Order → uses → Coupon                (promotion-service IssuedCouponController, CouponController)
POS: Order → rung by → Cashier → at → Store        (pos-service, channel-service)
```

Every edge above comes from a service that already exists. No new capture.

## Two versions — ship the first, document the second

### Version A — CPU baseline (recommended, ~12 days)
**Graph features + gradient boosting.** Compute the relational signals as *features* rather than learning
them with a GNN:

- return rate (30/90/365d), refund-to-spend ratio, reason-code entropy
- accounts sharing this phone / address / device / payment instrument
- coupon-per-account velocity, first-order-only coupon share
- COD refusal rate, courier-level dispute rate, cashier void/discount z-score
- time-of-day and inter-order-interval anomalies

Then XGBoost (or IsolationForest where labels are scarce) + **SHAP** for per-case explanation. Runs on CPU
in minutes. SHAP gives the same "why" the blueprint gets from Shapley values on Triton.

**Labels are the real problem.** Confirmed-fraud labels rarely exist. Handle it as:
1. **Rule-based seed labels** from cases CS already actions (returns rejected for abuse, blacklisted
   customers). Ask CS for their existing manual blacklist — it always exists, usually in a spreadsheet.
2. **Unsupervised anomaly scoring** for the cold start, with CS feedback (`confirmed` / `dismissed`) becoming
   the label stream.
3. Precision@50 as the metric, reviewed weekly by CS. Not AUC — nobody reviews 100k orders.

### Version B — GNN / transaction foundation model (needs GPU)
Once labels accumulate: GraphSAGE-style GNN on the entity graph per the blueprint, or pretrain a
`transaction-foundation-model`-style decoder on order sequences and use the 512-d embeddings for both fraud
and **customer segmentation** (which is a valuable second product from the same model). Requires
1×A100/H100 for training; inference could then be CPU-served. Document as the roadmap.

## Architecture

```
Nightly + near-real-time
  pgpool STANDBY ──▶ feature build (graph aggregates via SQL/recursive CTEs)
                          ▼
                  scoring job (CPU container: XGBoost + SHAP)
                          ▼
                  ai_risk_score(entity_type, entity_id, score, top_factors[], model_version)
                          ▼
        ┌────────────────┴──────────────────┐
        ▼                                    ▼
  CS review queue (front-end)         after-sales-service
  risk + SHAP factors + graph view    soft signal on refund approval
        │
        └─▶ CS verdict → label store → next training round
ai-service tool: explain_risk(entityId) → LLM narrates the SHAP factors in Vietnamese
```

**Advisory only.** The score never auto-rejects a refund. It reorders a review queue and adds a warning.
That is both the ethically correct design and the one that survives a legal review.

## Build steps

1. (4 days) Graph feature SQL on the read standby. Recursive CTEs for shared-identifier clusters.
2. (2 days) Seed labels from CS's existing blacklist + rejected-abuse cases.
3. (3 days) XGBoost + IsolationForest ensemble, SHAP, per-entity top-5 factors persisted.
4. (2 days) CS review queue UI with the shared-identifier cluster rendered as a small graph.
5. (2 days) Feedback loop: verdict → label store.
6. (1 day) `explain_risk` MCP tool → Vietnamese narrative from the SHAP factors.

## Risks

| Risk | Mitigation |
| --- | --- |
| **No labels** | Unsupervised start + CS feedback loop. Be explicit that v1 is anomaly detection, not classification. |
| **False accusation of a real customer** | Advisory-only, human decides, never auto-block. Log every score with its factors for appeal. |
| Bias against legitimate patterns (bulk buyers, resellers-by-agreement, shared family addresses) | Whitelist known B2B/wholesale accounts. Review the top factors for proxies of protected attributes. |
| PII in a fraud graph | Aggregate features only; the review UI shows identifiers to CS who already have access. Same OPA authz as any customer data. |
| Legal / data-protection | Advisory scoring on your own transaction data, human-in-the-loop, retention policy. Get sign-off before touching employee (cashier) scoring — that has labour-relations implications. |
| Scope creep into payment fraud | Out of scope. `payment-service` uses a PSP that does card fraud already. |

## Demo script (3 minutes)

1. CS queue sorted by risk. Top case: 94/100.
2. Factors: 8 accounts share this phone, 71% return rate, all returns "wrong size", all cash refunds.
3. Graph view: the eight accounts and the shared phone/address.
4. `explain_risk` → a Vietnamese paragraph a CS agent can paste into a case note.
5. CS clicks "dismiss" on a false positive → show the label landing in the feedback store.
6. Impact estimate: refund value in the top-50 queue vs the base rate.

## Effort

~14 dev-days for Version A. Strong business story, but **label scarcity is the honest weak point** — lead
with anomaly detection and the feedback loop rather than claiming a trained fraud classifier.
