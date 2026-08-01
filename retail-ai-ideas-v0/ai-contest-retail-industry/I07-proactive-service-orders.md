# I07 — Proactive customer service (fix it before they complain)

> **Sources:** Emarsys (#5 *predictive customer service — identify potential issues before escalation*) ·
> InsiderOne (roadmap: back-in-stock campaigns, price-drop notifications) ·
> IBM (instant support → higher satisfaction and loyalty) · NetSuite (simplified return processing) —
> **explicit in 1/8, implied in 3 more**
> **Local model:** rules + gradient boosting (CPU) + `qwen3.5:4b` for the message · **MiniMax:** rarely
> **New infra:** none · **GPU:** none · **Effort:** M (~2.5 weeks) · **Verdict:** medium–high

## Pitch

Most retail customer service is reactive: something goes wrong, the customer notices, gets annoyed, and
*then* contacts you. By that point you've spent the goodwill and you still have to fix the problem.

This flips it. Detect the four things that reliably go wrong with an order, and act **before** the customer
notices:

| Problem | Detected from | Proactive action |
| --- | --- | --- |
| **Will be late** | promised date vs courier scan progress vs historical route time | notify with a new ETA + an apology; offer a choice (wait / cancel / substitute) |
| **Will be short-shipped** | stock reserved vs picked, allocation shortfall | offer substitute or partial-ship, before it ships wrong |
| **Payment about to fail / order stuck** | order stuck in a state past its normal dwell time | one-tap retry link |
| **Delivery will be refused** (COD) | address quality, past refusal rate at that address, courier notes | confirm before dispatch → saves the whole round trip |

Plus the positive triggers, which cost nothing and convert well: **back-in-stock** and **price-drop**
notifications for items the customer actually wanted (InsiderOne names both).

## Why it fits here

- `order-service` has the state machine, `DeliveryLogController`, `O2oFulfillmentController` and
  `OperateLogController`. The events already exist; nothing is watching them for *customer* impact.
- The transactional outbox → Kafka → CDC path is live, so "watch the order stream" is a consumer, not an
  architecture.
- `workflow-service` orchestrates the follow-up actions.
- COD refusal is a genuinely Vietnamese cost problem — a refused COD delivery costs the full round-trip
  logistics and restocking, and it is highly predictable from address and history.

## The honest framing: this is mostly rules

Only one of the four detections needs a model:

| Detection | Method |
| --- | --- |
| Stuck order | **Rule** — state dwell time exceeds the p95 for that state. Zero ML. |
| Short-ship | **Rule** — reserved vs available at allocation time |
| Late delivery | **Model** — survival/classification on courier scan progress, route, daypart, weather-free features. Worth it: the signal is genuinely predictive and the timing matters. |
| COD refusal | **Model** — gradient boosting on address quality, past refusals at that address/phone, order value, category, daypart |

Say this in the deck. "We used a model where a model earned its place, and rules everywhere else" is a
better engineering story than pretending everything needs ML — and it is the same discipline applied in
[V07](../ai-contest-retail-vti/V07-document-ai-procurement.md)'s XML fast path.

## Architecture

```
Kafka order/delivery events (existing outbox → Debezium)
        ▼
ai-service  proactive-service consumer
   ├─ rule engine: stuck-state dwell, short-ship, allocation shortfall
   ├─ late-delivery model  (CPU, gradient boosting)   → P(late) + predicted new ETA
   ├─ COD-refusal model    (CPU)                      → P(refused)
   └─ positive triggers: back-in-stock (stock-service), price-drop (price-service)
        ▼
   intervention policy   ← the part that decides whether to say anything at all
        contact-frequency cap per customer per week
        only intervene when there is an ACTION the customer can take
        value threshold: don't message about a 30k order being 1 hour late
        quiet hours (no 23:00 notifications)
        ▼
   message composer   tier 0 qwen3.5:4b from a STRUCTURED input, validated
        (no invented dates, no invented compensation, correct order reference)
        ▼
   channel: existing notification path / Zalo-SMS-email as available
        ▼
   outcome tracking → ai_decision (I06): did it prevent a contact? a cancellation? a refusal?
```

**The intervention policy is the product.** A system that messages customers about every minor deviation is
worse than one that says nothing — it trains people to ignore you. The rule that matters: *only speak when
there is something the customer can decide.*

## Build steps

1. **(2 days)** Order-event consumer + a state-dwell baseline per state (p50/p95 from history). Ships the
   stuck-order detection immediately, with no model.
2. **(2 days)** Short-ship / allocation-shortfall rule at the point of allocation.
3. **(4 days)** Late-delivery model: courier scan history, promised vs actual per route/courier/daypart.
   Metric: precision@k on "will be >24h late", plus lead time — a prediction 10 minutes before delivery is
   worthless, the value is in predicting it a day out.
4. **(3 days)** COD-refusal model. **Design rule: it may prompt a confirmation call/message; it must never
   silently cancel or refuse to sell to a customer.** Same non-punitive rule as
   [I04](I04-returns-prediction-prevention.md).
5. **(2 days)** Intervention policy: frequency caps, value thresholds, quiet hours, action-required test.
6. **(2 days)** Message composition tier 0 + validator + a CS review queue for anything above a value threshold.
7. **(2 days)** Back-in-stock and price-drop triggers (cheap, high-converting, reuse
   [V05](../ai-contest-retail-vti/V05-personalization-loyalty.md)'s audience plumbing).
8. **(2 days)** Measurement via [I06](I06-ai-governance-measurement.md): holdout at customer level, primary
   metrics = inbound CS contacts per 1,000 orders, cancellation rate, COD refusal rate, CSAT if available.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Over-messaging** — telling customers about problems they'd never have noticed | Value threshold + action-required test + frequency cap + quiet hours. Measure inbound contacts: if proactive messages *increase* contacts, the policy is wrong and the holdout will show it. |
| Predicting late and being wrong (it arrives on time) | Only notify above a confidence threshold and with a real lead time; phrase as an updated ETA, not an apology for a failure that hasn't happened |
| **COD model becomes a refusal-to-serve mechanism** | Explicit rule: confirmation only, never auto-cancel. Address-quality features must not proxy for neighbourhood/income. Audit the top factors. |
| Message content wrong (dates, order refs, compensation) | Structured input + validator; never let the model generate a date or an amount — template them |
| Compensation policy creep ("sorry, here's a voucher") | Out of scope for v1. Notify and offer a *choice*, don't offer money. Compensation is a commercial decision with a policy owner. |
| Duplicate notifications with existing transactional emails | Check what `order-service` already sends before adding anything; dedupe by order + event type |
| Channel availability (Zalo/SMS gateway) | Start with whatever the platform already sends on; don't make a new channel integration a dependency |

## Demo script (2.5 minutes)

1. Order timeline in back-office: an order whose courier scans have stalled → flagged **"likely 2 days
   late"** 26 hours before the promised date.
2. The customer gets an updated ETA in Vietnamese with three options: wait / cancel / substitute.
   Show the composed message and the validator having checked the order reference and the date.
3. A COD order flagged high-refusal-risk → confirmation message before dispatch → customer confirms →
   dispatched. Point out: **no order was blocked.**
4. Show one the policy deliberately stayed quiet about: a 30k order, 40 minutes late, nothing the customer
   can do. Silence was the right output.
5. Holdout slide from [I06](I06-ai-governance-measurement.md): inbound CS contacts per 1,000 orders,
   treated vs control, with a CI.

## Effort

~19 dev-days. Steps 1–2 (4 days) are pure rules and already deliver value — a good standalone slice if time
is short.
