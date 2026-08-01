# C04 — 内容中台: Douyin / Xiaohongshu content factory, correctly labelled

> **Reading:** 🇨🇳 SELL-IN · **Effort:** M (~3 weeks) · **GPU:** none for text · **Verdict:** high

## The framing that keeps this from being a slop machine

The sharpest line in the research, worth putting on a slide verbatim:

> The common mistake is asking how to produce more content faster. AI's real value is **reading** search
> behaviour, comments, hesitation, creator performance and purchase signals at scale.
> **AI isn't replacing strategy — it's exposing weak strategy faster.**
> — [Digital Crew, How AI is changing Xiaohongshu marketing in 2026](https://www.digitalcrew.agency/how-ai-is-changing-xiaohongshu-marketing-in-2026/)

Xiaohongshu's own 2026 framing agrees: AI makes **"人心可读"** — moving from *behaviour analysis* to
*demand interpretation* (emotion, aesthetics, scenario, feeling), with trend insight and
region/audience-adapted script generation to lower content trial-and-error cost.
([小红书 WILL 商业大会解读](https://zhuanlan.zhihu.com/p/1989632373944522566))

And the warning: 2026 is predicted to bring **a flood of low-quality, homogenised AI content**, with
text-based AI working well but **text-to-image and text-to-video still unsatisfactory** at high learning
and commercial cost.
([回顾：小红书2026年经营趋势预判](https://www.msn.com/zh-cn/%E6%8A%80%E6%9C%AF/%E7%94%B5%E5%AD%90%E5%95%86%E5%8A%A1/%E5%9B%9E%E9%A1%BE-%E5%B0%8F%E7%BA%A2%E4%B9%A62026%E5%B9%B4%E7%BB%8F%E8%90%A5%E8%B6%8B%E5%8A%BF%E9%A2%84%E5%88%A4/ar-AA1YWnWg))

**So this plan is deliberately 70% analysis, 30% generation.**

## What it does

| Half | Function |
| --- | --- |
| **READ (the valuable half)** | Ingest our own notes/videos + comments + search terms + creator performance → cluster into demand themes, objections, hesitation points, and unmet questions. Feed that to the merchandiser and the buyer, not just the copywriter. |
| **WRITE (the cheap half)** | Generate note drafts / video scripts / titles per audience segment, grounded on **real SKU, price and stock**, validated, human-approved, and **labelled per 标识办法** |

The read half produces something no content tool produces: **"customers keep asking X and our listing
doesn't answer it"** → a task for [I05](../ai-contest-retail-industry/I05-product-data-quality.md) or
[N-02](../ai-contest-retail/02-catalog-enrichment.md), and a returns-cause signal for
[I04](../ai-contest-retail-industry/I04-returns-prediction-prevention.md).

## Methodology to encode (not invent)

- **KFS** — KOL via 蒲公英 + 信息流 Feeds + 搜索 Search. The backbone; encode it as the campaign structure.
- **人群反漏斗 (reverse funnel)** — saturate the core audience first, then expand outward through
  commercial traffic and organic word-of-mouth. This maps directly onto audience targeting in
  [C10](C10-cross-domain-reco-targeting.md).
- **Search-capture content** against high-volume keywords — because discovery is **intent-driven, not
  keyword-stuffing**: the recommender weighs content quality, dwell time, comment sentiment and
  cross-category interest, prioritising depth over volume.
- Users view **~15 notes before purchasing** — so the target is *presence across the consideration set*,
  not a single hit.

## Architecture

```
INGEST
  our own notes/videos + comments + search terms + creator performance
  (⚠ platform data only via sanctioned APIs — Douyin's service agreement PROHIBITS scraping)
        ▼
READ
  bge-m3 embeddings → pgvector → cluster into themes
  Qwen3.6: per cluster → {demand theme, objection, hesitation point, unanswered question}
        ▼
  ┌──────────────────┬─────────────────────┬────────────────────┐
  ▼                  ▼                     ▼                    ▼
merchandising    listing fix          returns cause        content brief
insight          (I05 / N-02)         (I04)                (the write half)

WRITE
  brief + real SKU/price/promo  →  Qwen3.6 via Qwen-Agent  →  draft note / script / title
        ▼
  VALIDATOR — this is the whole safety story
    price matches price-service · stock claim matches stock-service
    no invented discount · no 绝对化用语 (最好/第一/唯一 — advertising-law risk)
    category-restricted claims blocked (health, infant formula, cosmetics)
    length + format per channel
        ▼
  标识办法 LABELLING — explicit badge + implicit metadata (provider code + content ID)
        ▼
  human approval  →  publish via 抖店 / 开放平台 APIs
        ▼
  performance back → which themes, hooks and formats actually worked → next brief
```

## Sample repos & surfaces

| Component | Repo / surface | Licence |
| --- | --- | --- |
| LLM | Qwen3.6 | Apache-2.0 |
| Agent + tools | [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | Apache-2.0 |
| Embeddings | `BAAI/bge-m3` | MIT |
| Doc/knowledge retrieval | [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | Apache-2.0 |
| Publish / data | [抖店开放平台](https://op.jinritemai.com/) · [抖音开放平台 OpenAPI](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/list) | ⚠ enterprise entity required, scoped permissions, **no scraping** |

## Compliance — non-negotiable, and it is the differentiator

Per [00-china-compliance.md](00-china-compliance.md) §1 and
[CAC 标识办法](https://www.cac.gov.cn/2025-03/14/c_1743654685899683.htm), in force **1 September 2025**
with mandatory standard **GB 45438—2025**:

- **显式标识** — a badge users can clearly perceive, in the content or the interface
- **隐式标识** — in file metadata: attribute info, **provider name/code, content ID**; watermarking encouraged
- Platforms **verify labels at upload** and add risk warnings to unlabelled/suspected content
- **Deleting, altering or concealing labels is prohibited**

**Mint the content ID at generation, store it in `ai_decision`, and never publish an asset without both
labels.** Six major platforms already enforce badge + metadata. Trust is now a compliance property, not a
marketing one.

## Build steps

1. **(2 days)** Ingest own-account content + comments + search terms via sanctioned APIs.
2. **(4 days)** READ half: embed → cluster → theme/objection/question extraction. **Ship this first and
   show it to a merchandiser** — if it doesn't tell them something they didn't know, the rest isn't worth building.
3. **(3 days)** Routing of findings into the listing-fix queue (I05/N-02) and the returns-cause view (I04).
4. **(4 days)** WRITE half: brief → draft, grounded on live SKU/price/promo, per-channel formats.
5. **(3 days)** Validator: price/stock coherence, banned superlatives, category-restricted claims, length.
6. **(2 days)** 标识 labelling at generation + persistence in `ai_decision`.
7. **(2 days)** Approval UI + publish; performance feedback loop.
8. **(2 days)** Measurement per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):
   engagement and conversion of AI-assisted vs human-only content, on a holdout of themes.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Producing homogenised slop** — the predicted 2026 failure mode | 70/30 read-vs-write split; briefs come from observed demand, not from a topic generator; human approval always |
| **Labelling non-compliance** | At generation, both label types, persisted. Never bolt on at publish. |
| Advertising-law violations (绝对化用语) | Banned-word validator per channel; keep a rejection log and feed it back |
| Scraping platform data | **Prohibited by Douyin's service agreement.** Sanctioned APIs only, own-account data only. |
| Text-to-image / video quality | The research says both remain unsatisfactory. **Scope to text-first**: notes, scripts, titles. Images stay human or template-based. Say so. |
| Over-attribution of results | Holdout by theme; content attribution is genuinely hard — report with a CI or don't report |
| Brand voice drift | Style guide in the prompt + human approval + a periodic sample audit |

## Demo script (2.5 minutes)

1. READ view: 6 demand themes mined from our own comments and searches, with the top **unanswered
   question** highlighted — and the fact that our listing doesn't answer it.
2. That finding routed into the listing-fix queue.
3. Generate a Xiaohongshu note draft for one theme, grounded on the real SKU and price.
4. Try to make it say "最好的奶粉" → **validator blocks it**, with the rule cited.
5. Show the published asset's **on-screen AI badge** and its **file metadata** (provider code + content ID),
   per GB 45438—2025.
6. Slide: engagement/conversion, AI-assisted vs human-only, with a CI.

## Effort

~22 dev-days. Steps 1–3 (9 days) are the half that actually creates value and stand alone.
