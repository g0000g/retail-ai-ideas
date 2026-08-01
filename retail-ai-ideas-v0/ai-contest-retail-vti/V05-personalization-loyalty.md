# V05 — Personalization at scale & loyalty intelligence

> **VTI source:** "Personalization at scale", "Loyalty program platforms", "Custom CRM solutions", "Omnichannel engagement"
> **Local model:** `implicit` ALS / LightFM (Apache-2.0) + `bge-m3` (MIT) · **MiniMax:** only for campaign copy
> **New infra:** pgvector image swap · **GPU:** none · **Effort:** M (~3 weeks) · **Verdict:** high

## Pitch

Three outputs from one pipeline, all landing in systems that already exist:

1. **Recommendations** — "mua cùng", "mua lại", "dành cho bạn" on the storefront and in the POS upsell prompt.
2. **Segments** — RFM + behavioural clusters pushed into `tags-service` so `promotion-service` can target them.
3. **Next-best-offer per customer** — which of the currently active offers to show *this* person, and when.

## Why it fits without new plumbing

| Need | Already exists |
| --- | --- |
| Purchase history | `order-service` (`ItemController`, `ItemLineController`) |
| Customer master | `customer-service` |
| Customer labels / segments | **`tags-service`** — the natural home for segment membership |
| Offer targeting by audience | `promotion-service` (`OfferController`, `CouponIssueController`, `IssuedCouponController`) |
| Product content for cold-start | `goods-service` SKU/SPU text, ES-indexed |
| Channel context | `channel-service` |
| Read-only analytical access | pgpool standby |

The AI adds a scoring job and a serving endpoint. It does not add a CDP.

## Model choice — deliberately unfashionable

| Approach | Verdict |
| --- | --- |
| **ALS on implicit feedback** (`implicit`, MIT) | ✅ **Start here.** Purchases are implicit feedback. ALS is fast on CPU, trains in minutes on 10⁶ interactions, and is the strongest baseline per unit of effort in retail. |
| **LightFM** (Apache-2.0) | ✅ Second step. Hybrid — mixes collaborative signal with item/user features, which fixes cold-start for new SKUs without a separate code path. |
| **Content similarity via bge-m3 + pgvector** | ✅ Cold-start and "similar product" on the PDP. Reuses the embedding model V06/V11 already need. |
| Co-occurrence / association rules | ✅ Free, and often wins on "mua cùng" at the basket level. Compute nightly with SQL. |
| Sequential/transformer recommenders (SASRec, BERT4Rec) | ❌ Not for a contest. More training, more infrastructure, marginal lift over ALS on a mid-size catalogue. |
| LLM-as-recommender | ❌ Expensive, slow, and worse than ALS at ranking. The LLM's job here is *copy*, not ranking. |

**RecBole** (MIT) is worth an afternoon as an offline evaluation harness — it makes the "ALS beats X" claim
defensible with numbers instead of assertion.

## Architecture

```
Nightly (workflow-service flow)
  pgpool STANDBY ──▶ interaction matrix (customer × SKU, weighted: purchase > repeat > view)
                     + item features (category, brand, price band, attributes)
                     + RFM aggregates
                          ▼
                 model sidecar (CPU)
                   ├─ ALS  → user factors, item factors, top-N per customer
                   ├─ LightFM → hybrid scores (cold-start users/items)
                   ├─ co-occurrence → basket complements ("mua cùng")
                   └─ bge-m3 → SKU text embeddings → pgvector ("sản phẩm tương tự")
                          ▼
                 Postgres: ai_reco_user_topn · ai_reco_item_similar · ai_customer_segment
                          ▼
        ┌─────────────────┼────────────────────────┬──────────────────────────┐
        ▼                 ▼                        ▼                          ▼
  ecommerce-bff     pos-service upsell       tags-service              promotion-service
  storefront rails  cashier prompt           segment membership        audience targeting
        │
        └─▶ guardrail: never recommend out-of-stock, blocked, age-restricted,
                       or (for the health segment) contraindicated items
```

Serving is a **lookup**, not an inference call — top-N per customer is precomputed nightly and cached in
Redis. Latency is a Redis GET. That is why this works with zero GPU and zero model serving in the hot path.

## Segments worth shipping (concrete, not "clusters")

| Segment | Definition | Action |
| --- | --- | --- |
| Champions | high R, high F, high M | early access, referral ask |
| At-risk regulars | was frequent, R decayed past their own cadence | win-back offer sized to their margin |
| One-and-done | 1 purchase, > 60 days | second-purchase nudge |
| Price-led | > 70% of purchases on promotion | never send full-price campaigns; margin-aware offers only |
| Category loyalist | > 60% spend in one category | cross-category introduction |
| Replenishment-due | consumable SKU, purchase interval known, due now | **highest-converting segment in retail.** "Sữa của bé sắp hết?" |
| Bulk / suspected reseller | abnormal quantity + frequency | exclude from consumer promos; route to B2B |

**"Replenishment-due" is the one to demo.** For consumables — formula, diapers, supplements, pet food — the
inter-purchase interval per customer per SKU is computable with SQL, needs no ML, and converts better than
any recommender. Ship it in week one.

## The LLM's job: copy, not ranking

Tier 0 (`qwen3.5:4b`) writes the Vietnamese message from a **structured input** (segment, SKU, offer, tone),
against a validator that checks: required disclaimers present, no invented discount, price matches
`price-service`, length fits the channel. Escalate to MiniMax-M2.5 for longer campaign copy or when a
marketer wants variants.

**Customer names, phone numbers and addresses never reach tier 2.** Personalised copy is assembled locally
by templating the name into a tier-generated skeleton.

## Build steps

1. **(2 days)** Interaction + RFM views on the standby. `dim_calendar` reused if V02/V03 landed.
2. **(2 days)** **Replenishment-due** segment (pure SQL) + push into `tags-service`. Ship this first — it's
   the highest value per line of code in this folder.
3. **(4 days)** ALS in the model sidecar; offline eval (recall@k, NDCG@k) with a time-based split, against a
   popularity baseline. Popularity is a surprisingly strong baseline — beat it or don't ship.
4. **(3 days)** Co-occurrence complements + bge-m3/pgvector similar-items.
5. **(2 days)** LightFM for cold-start users and new SKUs.
6. **(3 days)** Serving: precomputed top-N → Redis; `ecommerce-bff` rails; `pos-service` cashier upsell.
7. **(2 days)** Segment writer → `tags-service`; audience hook in `promotion-service`.
8. **(3 days)** Copy generation + validator + a marketer review screen. Nothing sends unreviewed.
9. **(2 days)** Guardrails: stock, blocklist, age restriction, health contraindication, frequency cap.

## Risks

| Risk | Mitigation |
| --- | --- |
| Sparse history → weak collaborative signal | Popularity + content + replenishment-due carry the cold start. Report coverage (% of customers with a usable recommendation) honestly. |
| Recommending out-of-stock or restricted items | Hard filter at serve time against `stock-service` and a blocklist. Non-negotiable. |
| **Health/pharma recommendations** | For the drugstore segment: no therapeutic suggestions, ever. Restrict to consumables and previously-purchased items. Get this reviewed before demo. |
| Filter bubble / margin erosion | Blend exploration (~10% random-from-eligible) and include margin in the ranking objective, not just conversion |
| Over-messaging | Frequency caps per customer per channel per week, enforced centrally, not per campaign |
| PII in prompts | Names templated locally; tier 2 sees IDs only |
| "Personalization" becomes a CDP project | Line: scoring job + lookup serving + segments into `tags-service`. No identity resolution, no consent platform, no journey builder. |

## Demo script (3 minutes)

1. Storefront as a returning customer: "dành cho bạn" rail with plausible items; hover to show *why*
   ("bạn đã mua Meiji 800g 3 lần, lần cuối 26 ngày trước").
2. Replenishment-due segment: list of customers due this week, with the SKU and the predicted date.
   Generate the Vietnamese message → marketer reviews → sends.
3. POS: scan one item → cashier screen suggests a complement from the co-occurrence model.
4. Back-office: segment sizes, then create an offer in `promotion-service` targeted at "at-risk regulars"
   — real audience, real engine.
5. Try to recommend an out-of-stock SKU → filtered, with the reason logged.
6. Slide: recall@10 vs popularity baseline, coverage %, and the replenishment-due conversion estimate.

## Effort

~23 dev-days. Steps 1–2 (4 days) deliver the single highest-ROI piece and stand alone.
