# Idea 06 — Promotion Copilot (natural language → validated offer)

> **Blueprint source:** none directly — this is native. Borrows `aiq`'s structured-output + citation pattern.
> **New infra:** none · **GPU:** none · **Effort:** S (1–1.5 weeks) · **Verdict:** ⭐ cheapest win

## Pitch

A marketer types:

> *"Mua 2 tặng 1 cho sữa Meiji size 800g, chỉ ở cửa hàng miền Nam, từ 1/9 đến 15/9, tối đa 500 suất, không
> áp dụng chung với voucher sinh nhật"*

…and gets a **fully-formed, schema-valid promotion offer** in the draft state, with every field it inferred
highlighted and every field it couldn't infer asked back as a question. The marketer reviews and activates.

## Why this idea is almost free

The promotion offer schema is **already declarative**: required / hidden / `disabledWhen` rules live in
`offer-schema-labels.xml`, and there is a **single validator choke point** that every offer must pass.

That gives three things most LLM-structured-output projects have to build from scratch:

1. **A machine-readable schema** to hand the model — no prompt-engineering the field list by hand.
   `OfferSchemaController` can serve it.
2. **A deterministic validator** as the correctness gate. The model's output is never trusted; it's
   validated by the same code path a human-authored offer goes through.
3. **A repair loop** — feed validation errors back to the model and let it fix them. Because the validator
   is a choke point, this loop is sound rather than best-effort.

There is no vector DB, no RAG, no new dependency. It's one prompt, one structured-output call, one existing
validator, and a retry.

## Architecture

```
front-end (marketing)
   │  free-text campaign brief  (+ optional: paste last year's campaign)
   ▼
promotion-service   POST /v1/offers/draft-from-text
   │
   ├─▶ OfferSchemaController ──▶ schema + label/rule metadata (offer-schema-labels.xml)
   │
   ├─▶ ai-service  /v1/ai/structure   (Spring AI structured output → OfferDraft record)
   │       system prompt = schema + rules + 5 curated few-shot examples of real past offers
   │
   ├─▶ existing offer validator ──┐  invalid?
   │            ▲                 │
   │            └── repair loop ──┘  (max 2 retries, validation errors fed back verbatim)
   │
   ├─▶ resolve entities: SKU names → real SKU codes (goods-service),
   │                     "cửa hàng miền Nam" → store list (channel-service)
   │
   └─▶ Offer in DRAFT + a field-by-field provenance report
                │
                └─▶ marketer reviews ──▶ OfferController activate
```

Entity resolution is where the value is. "sữa Meiji size 800g" → actual SKU codes via
`search_product` (the MCP tool that already exists) is the difference between a text toy and something a
marketer would use.

## Build steps

**Phase 1 — schema-driven generation (4 days)**
1. `OfferSchemaController`: expose the schema + rule metadata as JSON for prompt injection (may already be close to this — check before adding).
2. `ai-service`: `POST /v1/ai/structure` — generic "text + JSON schema → validated record" endpoint. Reusable well beyond promotions.
3. Curate 5–8 few-shot examples from real historical offers, covering the common offer types (buy-X-get-Y, %-off, fixed-amount, bundle, threshold).
4. Structured output into the offer draft record.

**Phase 2 — validate & repair (2 days)**
5. Run the existing validator; on failure, return errors to the model and retry (cap 2). Log every repair —
   the repair-rate metric tells you which schema rules the model consistently misreads, which is genuinely
   useful product feedback.
6. Never persist an offer that fails validation. No exceptions, no "force save".

**Phase 3 — entity resolution + provenance (3 days)**
7. Product phrases → SKU codes via the existing `search_product` tool. **Ambiguous → ask, never guess.**
   If "Meiji 800g" matches 4 SKUs, return a disambiguation question.
8. Store/region phrases → store lists via `channel-service`.
9. Provenance report: per field, `{value, source: inferred|default|asked, confidence, quote from brief}`.
   The UI highlights inferred fields in amber.

**Phase 4 — UI (2 days)**
10. Angular: brief box → generated offer form with amber highlights → clarifying questions inline → activate.
11. Reverse direction, cheap and demo-friendly: **offer → plain-language summary** for QA and for the
    storefront's promotion description. Same schema, opposite arrow.

## Extensions (pick one if there's slack)

- **`OfferImportController` already exists** → bulk mode: a marketer's messy Excel campaign plan becomes N
  validated draft offers. This is the version that saves real hours.
- **Conflict detection**: after generating, check overlap against active offers on the same SKUs/stores and
  warn about stacking. The promotion engine can already evaluate combinations, so this is a query, not a model.
- **T&C generation**: emit customer-facing Vietnamese terms text from the structured offer — pairs with the
  promotion T&C corpus in [Idea 04](04-ops-rag-assistant.md).

## Risks

| Risk | Mitigation |
| --- | --- |
| Model invents a field or an enum value | Impossible to persist — the validator is the gate. Worst case is a retry. |
| Wrong SKU silently selected | Ambiguity → question, never a silent pick. Provenance shows exactly which SKUs were chosen. |
| Date/timezone misreads ("từ 1/9") | Inject "today" + tenant timezone into the prompt; render resolved dates back for confirmation |
| Marketer over-trusts it | Draft state + amber highlights + explicit activate step |
| `offer-schema-labels.xml` changes | The prompt reads the schema at runtime, so it follows the file automatically. That's the whole reason this is cheap. |

## Demo script (2.5 minutes)

1. Paste the Vietnamese brief above → validated draft offer appears in the real promotion form, ~4 seconds.
2. Point at the amber fields: those were inferred. Point at the clarifying question: 4 SKUs matched "Meiji 800g".
3. Deliberately give a contradictory brief ("giảm 200%") → validator rejects, model repairs or reports it
   can't. Show the log.
4. Activate → add the SKU to a cart on the storefront → the promotion applies. Real engine, real order.
5. Reverse: pick an existing complex offer → plain-Vietnamese explanation.

## Effort

**~11 dev-days.** Best effort-to-impact ratio in this folder, and it depends on nothing else — no vector DB,
no GPU, no new container, no data backfill. If the contest deadline is tight, build this one.
