# C10 — 跨域推荐 + 人群反漏斗 targeting

> **Reading:** 🧰 STACK · **Effort:** M (~3 weeks) · **GPU:** optional (TorchEasyRec accelerates; CPU works at our scale)
> **Verdict:** high — and it is the piece that makes multi-channel retail actually coherent

## The problem this solves that [V05](../ai-contest-retail-vti/V05-personalization-loyalty.md) doesn't

V05 builds recommendations from a single interaction matrix. A Chinese retail operation has **several
disconnected domains** for the same customer:

```
店内 POS        ·  storefront/mini-program  ·  抖音小店  ·  私域 WeCom group
即时零售 30-min  ·  社区团购 next-day pickup
```

A customer who buys formula in-store, browses on Douyin and asks questions in a WeCom group is **three
cold-start users** to a single-domain recommender. Cross-domain recommendation exists precisely for this.

**RecBole-CDR** *"unifies data structures and automatically matches overlapping data across domains"* —
which is the mechanism. ([RUCAIBox/RecBole-CDR](https://github.com/RUCAIBox/RecBole-CDR))

## The second half: 人群反漏斗 (reverse funnel)

Xiaohongshu's own targeting methodology, and it inverts the usual approach:

> **Saturate the core audience first, then expand outward** through commercial traffic and organic
> word-of-mouth into interest and mass audiences.

Paired with **KFS** (KOL via 蒲公英 + 信息流 Feeds + 搜索 Search) as the campaign structure.
([小红书 WILL 商业大会解读](https://zhuanlan.zhihu.com/p/1989632373944522566),
[2026小红书种草营销方法论](https://www.sohu.com/a/1010168094_121665362))

**Why it matters technically:** the reverse funnel is an *ordering* over audience segments with an
expansion rule. That is a concrete algorithm — start from the highest-affinity seed segment, expand by
similarity only when saturation is reached — not a slogan. It gives the targeting layer a defined shape
instead of "send to everyone who looks similar".

## Architecture

```
NIGHTLY
  pgpool STANDBY ──▶ per-domain interaction matrices
                       POS · storefront · Douyin · WeCom private domain
                       instant retail · group buying
                          ▼
  identity linking (the hard prerequisite)
     phone · member ID · WeCom external userid · platform openid
     ⚠ deterministic matching only. NO probabilistic identity stitching —
       PIPL makes speculative linkage a bad idea, and it is wrong often enough to hurt.
                          ▼
  ┌─────────────────────────┬──────────────────────────────┐
  ▼                         ▼                              ▼
EasyRec / TorchEasyRec   RecBole-CDR                  bge-m3 content
matching + ranking       cross-domain transfer         cold-start similarity
per domain               (overlapping users)           over CLEAN attributes (I05)
                          ▼
  ai_reco_user_topn  ·  ai_customer_segment  ·  ai_audience_ladder
                          ▼
  REVERSE FUNNEL LADDER per campaign
     tier 0 core seed (highest affinity)  →  saturation check  →
     tier 1 look-alike by embedding       →  saturation check  →
     tier 2 interest audience             →  tier 3 broad
     expansion gated on measured tier-0 saturation, not on budget burn
                          ▼
  ┌──────────┬──────────────┬───────────────┬──────────────┐
  ▼          ▼              ▼               ▼              ▼
storefront  mini-program   WeCom (C02)   Douyin ads    C04 content briefs
rails       rails          messages      audiences     (which theme, which tier)
```

**Serving is a precomputed lookup in Redis**, same as V05 — no model call in the request path.

## Sample repos

| Component | Repo | Licence | Role |
| --- | --- | --- | --- |
| **EasyRec** | [alibaba/EasyRec](https://github.com/alibaba/EasyRec) | **Apache-2.0** | industrial matching + ranking + multi-task, config-driven with HPO (AAAI'23) |
| TorchEasyRec | successor of EasyRec | — | PyTorch, GPU acceleration, hybrid parallelism |
| **RecBole-CDR** | [RUCAIBox/RecBole-CDR](https://github.com/RUCAIBox/RecBole-CDR) | — | **cross-domain** — auto-matches overlapping users across domains |
| RecBole / RecBole2.0 | [RUCAIBox/RecBole](https://github.com/RUCAIBox/RecBole) · [2.0](https://github.com/RUCAIBox/RecBole2.0) | — | **94 algorithms, 44 datasets** — use as the *evaluation harness*, not the serving layer |
| DeepCTR | [shenweichen/DeepCTR](https://github.com/shenweichen/DeepCTR) | — | CTR ranking models |
| Embeddings | `BAAI/bge-m3` | MIT | content cold-start, look-alike expansion |
| Audience delivery | [抖音开放平台 OpenAPI](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/list) · [binarywang/WxJava](https://github.com/binarywang/WxJava) | — | ⚠ scoped permissions; **no scraping** |

**Practical split:** EasyRec/TorchEasyRec for production, RecBole for benchmarking the claim that
cross-domain actually beats per-domain. **Run that benchmark** — cross-domain transfer does not always help,
and reporting "it didn't, here's the number" is a better result than assuming it did.

## Depends on

- **[I05](../ai-contest-retail-industry/I05-product-data-quality.md)** — content similarity over dirty
  attributes produces nonsense look-alikes. Sequence I05 → C10.
- **[V05](../ai-contest-retail-vti/V05-personalization-loyalty.md)** — the single-domain baseline that
  cross-domain has to beat.
- **`tags-service`** — where segments land, unchanged.

## Compliance

| Rule | Consequence |
| --- | --- |
| **PIPL** | Identity linking across channels is exactly the processing regulators scrutinise. **Deterministic keys only**, documented lawful basis, domestic processing. [00-china-compliance.md](00-china-compliance.md) §2 |
| Cross-border | Customer-level data never leaves. Model training and serving domestic. |
| Douyin service agreement | **No scraping.** Audiences delivered via sanctioned APIs only. |
| Alibaba's price-violation enforcement | Channel-price coherence is now enforced by the marketplace (listings **15%+ below guidance auto-downranked**). Cross-channel targeting must not create a price-coherence violation — that constraint belongs in [I01](../ai-contest-retail-industry/I01-price-markdown-optimization.md)'s rule set, and C10 must respect it. |

## Build steps

1. **(3 days)** Per-domain interaction matrices + **deterministic identity linking**. Report the link rate
   honestly — it caps everything downstream, exactly like geocoding does in I08.
2. **(2 days)** Single-domain baselines per domain (popularity + ALS). Nothing ships that doesn't beat them.
3. **(4 days)** EasyRec matching + ranking; offline eval with a **time-based** split.
4. **(4 days)** RecBole-CDR cross-domain; **benchmark it against the per-domain baseline** and report the
   delta per domain pair. Some pairs will not transfer.
5. **(3 days)** bge-m3 content similarity over I05-cleaned attributes → cold-start and look-alike.
6. **(3 days)** Reverse-funnel ladder: seed segment, saturation metric, expansion rule, tier assignment.
7. **(2 days)** Delivery: storefront/mini-program rails, WeCom messages (C02), Douyin audiences,
   content briefs to [C04](C04-content-factory-douyin-xiaohongshu.md).
8. **(2 days)** Guardrails: stock filter, blocklist, age/health restriction, central frequency cap,
   channel-price coherence check.
9. **(2 days)** Measurement per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):
   holdout at customer level; primary metric revenue per customer, secondary cross-domain lift.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Identity link rate is low** | Measure first; report it; deterministic only. A 40% link rate means cross-domain helps 40% of customers — say that, don't average it away. |
| **Cross-domain transfer doesn't help** | Benchmark in step 4 and report per domain pair. A negative result honestly reported is a fine outcome. |
| Probabilistic identity stitching under PIPL | Not done. Deterministic keys only. |
| Reverse funnel becomes "spray and pray" with extra steps | Expansion is **gated on measured tier-0 saturation**, not on remaining budget. Encode the gate. |
| Over-messaging across six channels | One central frequency cap across all channels, not per channel |
| Recommending an out-of-stock or delisted SKU | Serve-time filter against `stock-service` and the [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) assortment plan — the consistency guard from I06 |
| Channel-price incoherence triggering platform downranking | Price-coherence check before audience delivery |
| Scope creep into a CDP | Line: matrices, models, segments into `tags-service`, ladder, delivery. No consent platform, no journey builder, no identity-resolution product. |

## Demo script (3 minutes)

1. One customer, three domains: POS purchase, Douyin browse, WeCom question — **linked deterministically**,
   with the link key shown.
2. Recommendations before vs after cross-domain: the Douyin-only view was cold-start; with POS history it
   isn't.
3. Reverse-funnel ladder for a campaign: tier-0 seed of 4,200 customers, saturation at 68%, expansion to
   tier 1 **gated until saturation** — show the gate refusing to expand.
4. Same audience delivered to WeCom and to a Douyin audience via sanctioned APIs.
5. Try to include a delisted SKU → consistency guard blocks it.
6. Slide: revenue per customer, treated vs holdout, **plus the identity link rate and the per-domain-pair
   cross-domain delta** — including the pair where it didn't help.

## Effort

~25 dev-days, and it depends on [I05](../ai-contest-retail-industry/I05-product-data-quality.md).
Steps 1–3 (9 days) deliver a per-domain recommender; step 4 is where the China-specific value is, and it
is also the step most likely to return a null result. Budget for that honestly.
