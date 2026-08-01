# C07 — 中文智能客服 / 导购 agent

> **Reading:** 🧰 STACK · **Effort:** M (~3 weeks) · **GPU:** none (Qwen3.6-35B-A3B runs on one consumer GPU or a 24GB Mac; smaller variants on CPU)
> **Verdict:** high — the Chinese-language instance of the copilot pattern, with a better retrieval engine

## What's different from the copilot we already planned

[N-01](../ai-contest-retail/01-retail-copilot-mcp.md) defines a retail copilot over MCP tools.
C07 is the **same tool layer** with three China-specific substitutions:

| Layer | N-01 | C07 |
| --- | --- | --- |
| LLM | Nemotron (hosted NIM) | **Qwen3.6 (Apache-2.0), self-hosted domestically** — PIPL requires it |
| Retrieval | pgvector + rerank | **RAGFlow (Apache-2.0)** — DeepDoc parses layout/tables/scans *before* the vector store |
| Channel | web chat | **WeCom / mini-program / Douyin CS message push** |
| Tools | same MCP tools | same MCP tools |

**Build the tools once.** The tool contracts (`search_product`, `get_stock_availability`,
`get_price_for_channel`, `get_applicable_promotions`, `get_order_status`) are identical across N-01, V09,
C02 and C07. Only the model, retrieval engine and channel change.

## Why RAGFlow specifically

Chinese retail knowledge arrives as **badly-formatted PDFs**: 售后政策, 产品手册, 促销规则, 供应商合同,
质检报告. RAGFlow's **DeepDoc** layer parses layout, tables, figures and scanned PDFs *before* anything
reaches the vector store — which is the exact failure mode Apache Tika hits in
[V07](../ai-contest-retail-vti/V07-document-ai-procurement.md) and
[04](../ai-contest-retail/04-ops-rag-assistant.md) (tables in PDFs, flagged there as the known weak spot).

It also ships **chunk visualisation for human review** and **grounded answers with traceable citations** —
both of which are review-ability features, not model features, and both feed
[I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md).

⚠ It depends on **MySQL + Elasticsearch/Infinity**. We run Postgres and ES 7.17. Verify RAGFlow's ES
version requirement before committing — this is a real integration cost, and if it demands ES 8.x the
answer is a separate ES instance for RAGFlow, not an upgrade of ours.

Sources: [infiniflow/ragflow](https://github.com/infiniflow/ragflow) ·
[Jimmy Song — agent platform comparison 2026](https://jimmysong.io/blog/open-source-ai-agent-workflow-comparison/) ·
[Dify vs FastGPT vs RAGFlow](https://usedify.app/blog/workflow-platform-comparison-dify-fastgpt-ragflow)

## Architecture

```
channels: WeCom (C02) · mini-program · Douyin CS message push · storefront
        ▼
ai-service  service/guide agent   (Qwen-Agent, Apache-2.0)
  ├─ guardrail in: safety + topic + injection
  ├─ intent router (small model / heuristic — must be ~free)
  ├─ retrieval: RAGFlow over 售后政策 · 产品手册 · 促销规则 · FAQ · 话术库
  │             → grounded answer WITH CITATIONS, refuse below threshold
  ├─ MCP tools → goods / stock / price / promotion / order services
  ├─ OPA tool authz gate — persona × tool × args, FAIL CLOSED
  └─ guardrail out: PII redaction + grounding check
        ▼
  draft or direct reply (per-scenario), + escalation to a human
        ▼
  ai_decision registry (I06)
```

**The OPA action gate matters more here than anywhere else in this folder**, because a customer-facing
Chinese chat agent is the most-probed surface we would expose. Prompt injection is an *authorization*
problem, and `opa-policy` + `core-components/opa-interceptor` already exist —
see [N-12](../ai-contest-retail/12-ai-guardrails-opa.md).

## Sample repos

| Component | Repo | Licence |
| --- | --- | --- |
| LLM | Qwen3.6 | Apache-2.0 |
| Agent | [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | Apache-2.0 |
| RAG | [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | Apache-2.0 |
| Embeddings | `BAAI/bge-m3` | MIT |
| Alt. workflow orchestration | [langgenius/dify](https://github.com/langgenius/dify) | ⚠ multi-tenant SaaS restrictions |
| Alt. simple KB | [labring/FastGPT](https://github.com/labring/FastGPT) | ⚠ Apache-2.0 + no-competitive-service condition |
| WeCom channel | [binarywang/WxJava](https://github.com/binarywang/WxJava) | — |
| ASR (voice channel) | [QwenAudio/Fun-ASR](https://github.com/QwenAudio/Fun-ASR) Nano-2512 | Apache-2.0 |
| Reference implementation | [IYque/Iyque-SCRM](https://github.com/IYque/Iyque-SCRM) | Apache-2.0 — already does WeCom AI CS + Milvus RAG |

## Compliance

- **PIPL**: chat contains customer PI → **domestic inference only, no cross-border escalation**.
  [00-china-compliance.md](00-china-compliance.md) §2.
- **标识办法**: if replies are AI-generated and customer-facing without a human in the loop, the AI origin
  must be disclosed. Simplest compliant pattern: a persistent "AI 助手" label on the conversation.
- Audit logging aligned to the standards mandatory from **1 July 2026** — `ai_decision` covers it.

## Build steps

1. **(2 days)** RAGFlow deployment; **verify its MySQL/ES version requirements against our stack**.
2. **(3 days)** Corpus ingest: 售后政策, 产品手册, 促销规则, FAQ. Use DeepDoc's chunk visualisation to
   human-review the parse before indexing — that review step is the difference between a working RAG and a
   confidently wrong one.
3. **(3 days)** Qwen3.6 self-hosted + Qwen-Agent; MCP tools (reuse N-01's contracts verbatim).
4. **(2 days)** Grounded answering with mandatory citations; refuse below the similarity threshold.
5. **(3 days)** OPA tool gate (`ai_tools.rego`), fail closed; unit-test the "OPA down → deny" path.
6. **(3 days)** Channels: WeCom via WxJava, mini-program, storefront widget.
7. **(2 days)** Guardrails: in/out safety, PII redaction, AI-assistant disclosure.
8. **(2 days)** Measurement: containment rate (resolved without a human), citation-click rate, escalation
   rate, CSAT if available. Holdout per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md).

## Risks

| Risk | Mitigation |
| --- | --- |
| **RAGFlow's ES/MySQL dependency clashes with our stack** | Step 1 verification; separate instance if needed. Do not upgrade our ES 7.17 for this. |
| Confidently wrong policy answer | Mandatory citations; refuse below threshold; human review of chunks at ingest |
| Prompt injection via product text or customer message | OPA tool gate (authorization, not prompting) + untrusted-data wrapping of tool results |
| PI crossing the border | Domestic inference; scrubber + OPA deny |
| Over-automation on 售后 decisions | The agent **explains** policy; refund/return approvals stay with `after-sales-service` and a human |
| Chinese-specific tone/politeness | Style guide in the prompt; sample audits; the 话术库 is the source of truth for tone |
| Building a fourth chat surface | Same tool layer as N-01/V09/C02 — one implementation, four channels |

## Demo script (2.5 minutes)

1. Ask in Chinese: *"这个奶粉多少钱？还有货吗？"* → grounded answer with real price and stock, and the SKU cited.
2. *"过了30天还能退吗？"* → policy answer **with a citation that opens the exact page** of the 售后政策.
3. Prompt injection attempt asking for another customer's order → **OPA denies**; the audit line shows the
   principal, the tool and the rule that fired.
4. Ask something outside the corpus → it declines instead of inventing.
5. Same agent answering inside **WeCom** and inside the mini-program — one tool layer, two channels.
6. Slide: containment rate and escalation rate vs the holdout.

## Effort

~20 dev-days, of which ~6 are reused from N-01's tool layer if that was built first.
