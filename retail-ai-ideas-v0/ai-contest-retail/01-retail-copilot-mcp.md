# Idea 01 — Retail Copilot (MCP-native multi-agent assistant)

> **Blueprint source:** `retail-shopping-assistant` (primary), `ai-virtual-assistant` (CS patterns), `aiq` (orchestration)
> **New infra:** none · **GPU:** none (hosted NIM) · **Effort:** S–M (2–3 weeks) · **Verdict:** ⭐ best pick

## Pitch

One conversational surface, two personas, one backend:

- **Shopper mode** (on `ecommerce-front-end`) — "tìm sữa cho bé 2 tuổi dưới 300k, còn hàng ở quận 7" →
  product candidates with real price + real stock, add to cart, order status, returns.
- **Store-staff / CS mode** (on `front-end` back-office) — "đơn SO-12345 đang ở đâu, tại sao chưa giao?",
  "khách này mua gì 3 tháng qua?", "SKU này còn ở kho nào?"

The differentiator versus every other contest entry: **the answers are not hallucinated and not from a
demo CSV.** They come from `goods-service`, `stock-service`, `order-service`, `price-service`,
`promotion-service` through MCP tools that already exist or are 30 lines each.

## Why this is the cheapest strong entry

`ai-service` is **already** a Spring AI 2.0 MCP server with `get_customer`, `search_product`,
`get_product_by_sku`. The blueprint's "Catalog Retriever" and "Memory Retriever" agents are exactly what
those tools do — we already built the hard half (auth, tenant headers, Vietnamese keyword normalisation,
stable error contract) and skipped it in the blueprint's Python.

## Architecture

See `diagrams/idea-01-retail-copilot.drawio.png`.

```
Angular FE (SSE)  →  BFF (SSE proxy)  →  ai-service
                                          ├─ Spring AI ChatClient → Nemotron (hosted NIM, OpenAI-compatible)
                                          ├─ Guardrail pre/post   → NemoGuard 8B (hosted)
                                          ├─ MCP tools (in-process @Tool beans)
                                          │    ├─ search_product / get_product_by_sku → goods-service (Feign)
                                          │    ├─ get_customer                       → back-office-bff
                                          │    ├─ NEW get_stock_availability         → stock-service
                                          │    ├─ NEW get_order_status               → order-service
                                          │    ├─ NEW get_applicable_promotions      → promotion-service
                                          │    └─ NEW get_price_for_channel          → price-service
                                          └─ conversation memory → Redis (already deployed)
```

**Key design call: no Python, no LangGraph.** Spring AI 2.0's `ChatClient` + `@Tool` gives the tool-calling
loop natively. The blueprint's LangGraph state machine buys us multi-agent supervision we don't need for
6 tools. If the conversation later needs true multi-agent routing, add it then.

`spring-cloud-bff` already has an SSE proxy — streaming tokens to Angular is a route entry, not a feature.

## Build steps

**Phase 1 — chat loop (3 days)**
1. Add `spring-ai-starter-model-openai` to `ai-service/pom.xml`; `spring.ai.openai.base-url=https://integrate.api.nvidia.com/v1`, `spring.ai.openai.chat.options.model=nvidia/nemotron-3-nano-30b-a3b`.
2. `NVIDIA_API_KEY` from OpenBao via the existing `core-components/openbao-client`.
3. `ChatController` with `POST /v1/ai/chat` returning `text/event-stream`; register the existing `@Tool` beans on the `ChatClient`.
4. System prompt per persona, loaded from `src/main/resources/prompts/{shopper,staff}.st`.

**Phase 2 — widen the tool surface (5 days)**
5. Four new tool classes mirroring `ProductTools` structure exactly (`StockTools`, `OrderTools`, `PromotionTools`, `PriceTools`). Each: Feign client in `integration/`, DTO records in `model/dto/`, `@Tool` in `tools/`.
6. Contract docs in `ai-service/docs/contracts/` — the repo already does this per tool.
7. Redis-backed `ChatMemory` keyed by `tenantId:userId:sessionId`.

**Phase 3 — safety + auth (3 days)**
8. NemoGuard content-safety call as a pre-filter and post-filter (see [Idea 12](12-ai-guardrails-opa.md)).
9. **Tool-level authz through OPA** — `core-components/opa-interceptor` on every tool invocation, so a
   shopper session can never reach a staff tool even if the model is prompt-injected into trying. This is
   the single most convincing slide for judges.

**Phase 4 — UI (4 days)**
10. Angular chat panel: `ecommerce-front-end` (shopper) + `front-end` (staff). Both stacks already have
    conventions for SSE + generated clients.
11. Render product cards, not raw text, when the tool result is a SKU list.

## Data readiness

| Need | Status |
| --- | --- |
| SKU catalogue + attributes | ✅ `goods-service`, ES-indexed (`es-mappings/goods_sku_v1.json`) |
| Price by channel | ✅ `price-service` |
| Stock by warehouse/store | ✅ `stock-service` (`es-mappings/stock_open_v1.json`) |
| Order + after-sales status | ✅ `order-service` (`OrderController`, `AfterSaleHeaderController`) |
| Customer history | ✅ `customer-service` |
| Promotions applicable to a cart | ✅ `promotion-service` `PromotionCheckoutController` |

Nothing needs to be created. That is the whole point.

## Models (all hosted, no GPU)

| Role | Model | Notes |
| --- | --- | --- |
| Chat / tool-calling | `nvidia/nemotron-3-nano-30b-a3b` | Fast + cheap; escalate to `nemotron-3-super-120b-a12b` for hard turns via [Idea 11](11-llm-router-cost-governance.md) |
| Content safety | `nvidia/llama-3.1-nemoguard-8b-content-safety` | Both directions |
| Embeddings (only if semantic catalogue search is added) | `nvidia/llama-nemotron-embed-1b-v2` | Optional — ES BM25 is often enough for VN SKU names |

## Risks

| Risk | Mitigation |
| --- | --- |
| **Corporate MITM proxy blocks `integrate.api.nvidia.com`** | Test with `curl` before day 1 of coding. Same class of failure already seen with Harness clone + OTel export. Fallback: route through an allowed egress host. |
| Vietnamese quality of Nemotron | Benchmark 30 real VN queries in week 1. Fallback: keep the system prompt + tool descriptions in English, user turns in VN — Nemotron handles this well. |
| Tool-calling loops / runaway cost | Cap `maxToolCalls`, cap tokens, per-session budget in Redis, dashboards from [Idea 11](11-llm-router-cost-governance.md) |
| Prompt injection via product descriptions | Tool results wrapped as untrusted data blocks; OPA gate on any write-capable tool. All tools in phases 1–2 are read-only by design. |
| `:8109` port clash with Apicurio | Move `ai-service` to `:8120` before dev deploy |

## Demo script (4 minutes)

1. Shopper: VN natural-language query → real SKUs with live price/stock. Show the SKU in back-office to prove it's real data.
2. "Cái thứ 2 còn hàng ở đâu?" → follow-up resolved from memory, stock per store.
3. "Add 2 cái vào giỏ và áp mã tốt nhất" → promotion engine picks the best offer.
4. Switch to staff mode, ask about a specific order → traced end-to-end in Grafana Tempo (OTel already
   instruments every service, so the LLM span sits in the same trace as the JPA query).
5. Try a prompt injection asking for another customer's data → OPA denies, guardrail logs it.

Step 4 is the money shot: **one distributed trace from LLM token to SQL row.** No other contest entry will
have that, because no other entry has an LGTM stack already wired to 19 services.

## Effort

| Phase | Days |
| --- | --- |
| 1 chat loop | 3 |
| 2 tool surface | 5 |
| 3 safety + authz | 3 |
| 4 UI | 4 |
| buffer/demo | 3 |
| **Total** | **~18 dev-days** |
