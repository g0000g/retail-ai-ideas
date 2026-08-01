# C02 — 私域运营 agent: WeCom SCRM + AI

> **Reading:** 🇨🇳 SELL-IN · **Effort:** M (~3 weeks) · **GPU:** none · **Verdict:** ⭐ the #1 published 私域 trend for 2026

## Why this

The 2026 private-domain outlook lists six trends, and **#1 is "AI moves from optional to standard
operating infrastructure"** — with the striking specific that **LLM agents can now simulate private-domain
group leaders (团长) as "digital clones"**.
([人人都是产品经理 — 2026年品牌私域电商发展6大趋势](https://www.woshipm.com/operate/6300297.html))

The other five trends that shape this plan:
2. private domain becomes a **default brand configuration**
3. restructured **brand ↔ distributor** relationships
4. **deep fusion with instant retail** — private domain is cultivation, instant retail is efficiency
5. **membership deepens** — points → tiered growth, exclusive discounts, new-product trials, dividend rights
6. fragmented platforms unify into **multi-endpoint integration**

**And the reason this is cheap for us specifically: [WxJava](https://github.com/binarywang/WxJava) is a
Java SDK.** Our backend is Java 21 / Spring Boot 4.1. WeChat Pay, mini programs, WeCom, Channels and
official accounts all drop in without a language boundary.

## What the agent actually does

Not "a chatbot in WeCom". Four concrete jobs, each with an owner who benefits:

| Job | Who benefits | Mechanism |
| --- | --- | --- |
| **1 · Reply drafting for the 导购/客服** | frontline staff | agent drafts a Chinese reply grounded on real SKU/price/stock/order data; **staff sends it, or edits it** |
| **2 · Customer tagging from conversation** | marketing | extract intent, category interest, objection, life stage → write tags into WeCom + `tags-service` |
| **3 · Follow-up scheduling** | store manager | who to contact, when, about what — driven by replenishment cycle, cart abandonment, tier change |
| **4 · Group (社群) content** | operations | daily group post: new arrivals, offers, restock alerts — validated against live price/stock |

**Job 1 is the one to build first.** It's the highest-volume, lowest-risk, and the edit-distance between
draft and sent message is a free quality metric.

## Architecture

See `diagrams/china-02-private-domain.drawio.png`.

```
WeCom (企业微信)
  ├─ customer chat · group chat · Moments · channel live codes (渠道活码)
  └─ message archive callback
        ▼
SCRM layer  —  OpenSCRM (Apache-2.0, Go) or MarketGo-SCRM (Java)
  customer / staff / tag / group-chat / department event handlers
        ▼
ai-service  private-domain agent   (Qwen-Agent, Apache-2.0)
  ├─ intent + entity extraction        Qwen3.6, schema-constrained, validator
  ├─ retrieval                          RAGFlow over product manuals, policies, FAQ, 话术库
  ├─ MCP tools → our services           search_product · get_stock · get_price ·
  │                                     get_applicable_promotions · get_order_status
  ├─ reply DRAFT (never auto-send by default)
  └─ tag writer → WeCom tags + tags-service
        ▼
staff sidebar in WeCom: draft + the evidence behind it + one-click send/edit
        ▼
outcome → ai_decision registry (I06): draft accepted / edited / discarded
```

**Human-in-the-loop by default.** Auto-send is a per-scenario opt-in (e.g. order-status queries), never the
global setting. The override rate is the trust KPI, exactly as in
[V02](../ai-contest-retail-vti/V02-ai-staff-scheduling.md).

## Sample repos

| Component | Repo | Licence | Why this one |
| --- | --- | --- | --- |
| **WeChat/WeCom SDK** | [binarywang/WxJava](https://github.com/binarywang/WxJava) | — | **Java** — matches our stack exactly |
| SCRM (Go, minimal deps) | [openscrm/api-server](https://github.com/openscrm/api-server) | **Apache-2.0** | only MySQL + Redis; delayed queues on Redis, full-text search on MySQL 8 — no Kafka/ES to run |
| SCRM (Java) | [marketgo-scrm/MarketGo-SCRM](https://github.com/marketgo-scrm/MarketGo-SCRM) | — | Java microservices built for secondary development; 渠道活码, mass messaging, Moments |
| SCRM + AI reference | [IYque/Iyque-SCRM](https://github.com/IYque/Iyque-SCRM) | Apache-2.0 (retain logos) | **already does RAG on Milvus + WeCom AI customer service + chat-record capture** — read this before designing |
| Framework/engine | [mochat-cloud/mochat](https://github.com/mochat-cloud/mochat) | — | SCRM app development engine |
| Mall / membership | litemall | — | Spring Boot + Vue admin + **WeChat mini-program** frontend |
| Agent | [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | Apache-2.0 | MCP, tool calling |
| Retrieval | [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | Apache-2.0 | DeepDoc parses the messy PDFs a 话术库 arrives as |

**Read 源雀 (Iyque-SCRM) first.** It has already built the WeCom + RAG + auto-reply combination this plan
describes. Either adopt it or learn from its data model rather than re-deriving.

## Compliance — this idea touches customer PI directly

| Requirement | Consequence |
| --- | --- |
| **PIPL** — cross-border PI transfer needs a lawful basis | **Inference runs domestically. No cross-border escalation for chat content, ever.** Qwen3.6 self-hosted. See [00-china-compliance.md](00-china-compliance.md) §2. |
| Message archive contains sensitive data | OpenSCRM's own docs flag this (phone numbers, titles, customer tags). Encrypt at rest, gate access via OPA, log every read. |
| **标识办法** if any generated content is customer-facing | Group posts and Moments content generated by AI need explicit + implicit labels |
| Minors' data annual audit filing (from 31 Jan 2026) | ⚠ applies if the category is infant/baby — which is the recommended demo category |

**Demonstrable engineering controls, not documented ones** — tokenisation, anonymisation, gated access,
encryption. That is what the certification route actually reviews.

## Build steps

1. **(3 days)** WxJava + WeCom app registration; message-archive callback ingest; customer/staff/tag sync.
2. **(2 days)** Evaluate 源雀 vs OpenSCRM vs MarketGo — pick one, don't build a fourth.
3. **(4 days)** Reply-draft agent: Qwen3.6 + MCP tools + RAGFlow over the 话术库, with a validator
   (no invented price, no invented promise, correct order reference).
4. **(2 days)** WeCom staff sidebar: draft + evidence + send/edit/discard, writing the outcome to `ai_decision`.
5. **(3 days)** Conversation → tag extraction → WeCom tags + `tags-service`.
6. **(3 days)** Follow-up scheduler: replenishment cycle (reuse the *replenishment-due* segment from
   [V05](../ai-contest-retail-vti/V05-personalization-loyalty.md) — it is the highest-converting segment
   there and translates directly), cart abandonment, tier change.
7. **(2 days)** Group content generation + validator + human approval + AI labelling.
8. **(2 days)** Measurement: draft-acceptance rate, edit distance, reply latency, conversion per follow-up.
   Holdout at staff level per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md).

## Risks

| Risk | Mitigation |
| --- | --- |
| **Auto-send says something wrong to a customer** | Draft-by-default; auto-send is per-scenario opt-in; validator on price/promise/order-ref |
| PI leaving the country | Domestic inference only; scrubber + OPA deny rule from [V12](../ai-contest-retail-vti/V12-local-model-gateway.md) |
| WeCom API rate limits and message-archive quotas | Batch, backoff, respect the SDK's throttling; archive ingest is asynchronous |
| Spamming customers (frequency) | Central frequency cap per customer per week across all channels — the same cap V05 defines |
| Staff resist ("the AI writes worse than me") | Draft-and-edit, never replace. Track acceptance rate; if it's low, the prompts or the retrieval are wrong. |
| Building a fifth SCRM | Adopt one open-source SCRM; our contribution is the **agent + the connection to real commerce data**, not the CRM |
| Scope creep into full marketing automation | Line: draft, tag, schedule, group post. No journey builder, no consent platform. |

## Demo script (3 minutes)

1. Customer message arrives in WeCom: *"这个奶粉还有货吗？比上次贵了吗？"*
2. Staff sidebar shows a drafted Chinese reply with **real stock and the real price history**, plus the
   evidence chips (which SKU, which store, which price record).
3. Staff edits two words and sends. The edit is recorded in `ai_decision`.
4. Tags extracted automatically: category interest, price-sensitive, stage — written into WeCom and
   `tags-service`.
5. Follow-up queue: this customer is **replenishment-due in 9 days**, scheduled.
6. Group post generated for tomorrow with the **AI-generated label**, awaiting approval.
7. Slide: draft-acceptance rate and reply-latency, treated staff vs holdout.

## Effort

~21 dev-days.
