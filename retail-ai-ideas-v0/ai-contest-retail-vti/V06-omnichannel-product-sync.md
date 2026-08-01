# V06 — Marketplace sync & taxonomy-mapping agent

> **VTI source:** "Product synchronization across channels", "Omnichannel (OMO) Commerce Integration", "Multi-channel order management"
> **Local model:** `bge-m3` (MIT) + `qwen3.5:4b` · **MiniMax:** occasionally, for ambiguous categories
> **New infra:** pgvector image swap · **GPU:** none · **Effort:** S–M (~2.5 weeks) · **Verdict:** high

## Pitch

Listing one SKU on Shopee, Lazada and TikTok Shop means solving the same three problems three times:

1. **Category mapping** — our category tree ≠ their category tree. Thousands of nodes each, and they change.
2. **Attribute mapping** — each marketplace demands its own required attributes with its own enum values.
3. **Title/content per channel** — different length limits, different keyword behaviour, different rules.

Plus the ongoing one nobody budgets for: **drift detection** — after a week, marketplace prices, stock and
titles no longer match ours, and nobody notices until a customer complains.

## Why this is cheap here

The hard integration work is done: there is a **Shopee connector** (`core-components/shopee-client`,
webhook HMAC push signature handled), `channel-service` models sales channels, `goods-service` owns the
catalogue with attributes and an ES index, and `price-service` prices per channel.

What's missing is the *semantic* layer, and semantic matching over a few thousand taxonomy nodes is a
retrieval problem — `bge-m3` + pgvector — not a training problem.

## Architecture

```
goods-service SKU/SPU (source of truth)
        ▼
ai-service  channel-listing pipeline
   ├─ 1. CATEGORY MAPPING
   │      marketplace category tree → bge-m3 embeddings → pgvector
   │      our category path → embed → top-5 candidate nodes → qwen3.5:4b picks + justifies
   │      confidence < threshold → human confirms once, then CACHED FOREVER
   │      (a category mapping is a one-time decision per category pair, not per SKU)
   ├─ 2. ATTRIBUTE MAPPING
   │      fetch the marketplace's required attributes for the chosen node
   │      map from our SkuAttributeValue; enum values constrained to THEIR list
   │      missing required attribute → task back to merchandising, not a guess
   ├─ 3. CHANNEL CONTENT
   │      title within the channel's length limit, keyword-front-loaded
   │      description reformatted; forbidden claims stripped
   │      tier 0 generates, validator checks length/banned words/price consistency
   └─ 4. DRIFT DETECTION (the sleeper feature)
          nightly: pull live listings → diff vs our truth
          price mismatch · stock mismatch · title edited on the marketplace ·
          listing suspended/delisted · attribute wiped by a taxonomy change
          → reconciliation queue + Kafka event
        ▼
   channel-service / shopee-client  ──▶  Shopee · Lazada · TikTok Shop
```

**The key economic insight:** category mapping is a **per-category-pair** decision, not per-SKU. Map 300
categories once, with human confirmation on the uncertain ones, and 50,000 SKUs are mapped. That makes the
LLM cost trivial and the accuracy human-verified. Any design that calls a model per SKU is wrong.

## Drift detection deserves top billing

Ask anyone who runs marketplace channels what actually costs them money, and it is not the initial listing —
it is the silent divergence afterwards:

| Drift | Consequence |
| --- | --- |
| Marketplace price stale after our price change | selling below margin, or losing the buy-box |
| Stock not synced | oversell → penalty, rating damage, forced cancellation |
| Title/content edited on the platform | brand inconsistency, lost keywords |
| Listing auto-suspended | invisible revenue loss for days |
| Marketplace changed its taxonomy | required attribute now missing → listing degraded |

This is a **diff job plus a queue** — almost no AI — and it is the part a retail judge will react to. The
Kafka event schema goes in Apicurio like every other event (`mvn verify -Pschema-registry` gate applies).

## Where each tier is used

| Step | Tier | Notes |
| --- | --- | --- |
| Taxonomy embedding + retrieval | tier 0 `bge-m3` | 100+ languages, dense+sparse — handles Vietnamese category names and mixed VN/EN brand terms |
| Category pick from top-5 | tier 0 `qwen3.5:4b` | Constrained choice from 5 options with a justification. Small models are good at this. |
| Genuinely ambiguous category | **tier 2 MiniMax-M2.5** | Rare, one-off per category pair, so cost is negligible |
| Attribute mapping | tier 0, enum-constrained | Never free-text an attribute that has a value list |
| Title/description generation | tier 0, validator behind it | Escalate only when a marketer wants variants |
| Drift diff | none | Deterministic comparison |

Public catalogue text is fine for tier 2 (see `00-model-stack.md` § 11). **Our cost prices and margins are
not** — never include them in a listing prompt.

## Build steps

1. **(2 days)** Ingest marketplace taxonomies (Shopee first — the connector exists) into
   `ai_channel_category` + bge-m3 embeddings in pgvector.
2. **(3 days)** Category mapping: retrieve top-5 → `qwen3.5:4b` picks with justification → confidence
   threshold → human confirmation UI → persist the mapping permanently.
3. **(3 days)** Attribute mapping against the marketplace's required-attribute list for the mapped node;
   unmapped required attributes become merchandising tasks.
4. **(3 days)** Channel content generation + validator (length, banned words, price consistency with
   `price-service`, no invented claims).
5. **(4 days)** Drift detection job: pull listings, diff, classify the drift type, queue + Kafka event with
   an Apicurio-registered schema.
6. **(2 days)** Back-office UI: mapping review, listing status per channel, drift queue with one-click re-sync.

## Risks

| Risk | Mitigation |
| --- | --- |
| Marketplace taxonomies change without notice | Re-ingest on a schedule; drift detection catches degraded listings. Treat a taxonomy change as an expected event, not an incident. |
| Wrong category → listing rejected or buried | Human confirms below the confidence threshold; mapping is cached and auditable; wrong mappings are correctable in one place, not per SKU |
| **Oversell from stock desync** | Stock sync stays on the existing connector path with its existing reservation semantics. Do not build a faster parallel path. Drift detection is a safety net, not the mechanism. |
| Generated titles trip marketplace content rules | Banned-word validator per channel; keep a rejection log and feed it back into the validator |
| Rate limits / API quotas | Batch, backoff, and respect the connector's existing throttling |
| Shopee sandbox limitations | Known: the sandbox test-machine push signature can't be verified. Plan the demo around a recorded/replayed webhook rather than a live sandbox push. |
| Scope creep to all marketplaces at once | Shopee only for the contest. Lazada/TikTok are the same pipeline with a different taxonomy — say that, don't build it. |

## Demo script (2.5 minutes)

1. Pick a new SKU → run the pipeline → mapped Shopee category with the model's justification, required
   attributes filled from our attribute values, channel-optimised Vietnamese title within the length limit.
2. Show one ambiguous category → confidence low → human confirmation screen → **confirm once**, then apply
   it to 40 SKUs in that category instantly. Point out this is why it costs almost nothing.
3. Change the price in `price-service` → nightly drift job (run manually) flags the marketplace as stale →
   one-click re-sync.
4. Simulate a marketplace-side title edit → drift detected and classified.
5. Slide: SKUs listed per hour before vs after; drift incidents caught per week.

## Effort

~17 dev-days. Steps 5–6 alone (6 days) are a standalone, genuinely useful feature with almost no model risk —
a good fallback if time runs short.
