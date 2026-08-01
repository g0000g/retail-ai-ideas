# AI Contest — Retail Domain Ideas (NVIDIA AI Blueprints × current OMS/IMS/POS)

Investigated: all 37 repos in <https://github.com/orgs/NVIDIA-AI-Blueprints/repositories> (July 2026 snapshot).
Full inventory + relevance verdict per repo: [00-blueprint-catalog.md](00-blueprint-catalog.md).

> **Second idea set available:** [`../ai-contest-retail-vti/`](../ai-contest-retail-vti/README.md) — same
> exercise against the [VTI retail catalogue](https://vti.com.vn/retail-software-solutions/), with
> **open-weight models (Ollama / Hugging Face) + a MiniMax API key** instead of hosted NVIDIA NIM.
> It supersedes several ideas here — see its "Cross-set overlaps" table before building
> **05** (Chronos-2 beats the sklearn ensemble), **09** (edge box beats datacentre GPU),
> **07** (PhoWhisper removes the Vietnamese ASR gate) and **11** (the 3-tier gateway is a superset).
>
> **Third idea set:** [`../ai-contest-retail-industry/`](../ai-contest-retail-industry/README.md) — 8 industry
> articles read for market consensus, with a
> [26-use-case × 8-source matrix](../ai-contest-retail-industry/00-consensus-matrix.md) and 8 gap-filling
> plans (pricing/markdown, waste, assortment, returns prevention, product data quality, AI governance,
> proactive service, routing).

> **Fourth idea set:** [`../ai-contest-retail-china/`](../ai-contest-retail-china/README.md) — self-directed research on the **China market + Chinese open-source stack**, with a source link on every
> claim and a **GitHub repo for every component** (Qwen3.6, DeepSeek V4, PP-ShiTuV2, RAGFlow, Duix.Heygem,
> EasyRec, WxJava, OpenSCRM). Includes a China compliance brief — **AI labelling 标识办法** (in force
> 2025-09-01) and **PIPL cross-border certification** (effective 2026-01-01).
> ⚠ It also records that **MiniMax M3 is now licence-restricted**, which affects the VTI set's escalation tier.

> **Fifth idea set:** [`../ai-contest-retail-china-r2/`](../ai-contest-retail-china-r2/README.md) — China round 2, with
> **robotics** as the new dimension plus the open source round 1 missed. Ideas are sorted by a **feasibility
> ladder** (tier A pure software → tier D real fleet), so tiers A and B are buildable with **zero hardware budget**.
> Includes the robotics OSS stack (Open-RMF, Nav2, Cartographer, Gazebo/Isaac/Genie Sim, OpenVLA/GR00T) and
> Milvus / Xinference / MiniCPM-V. ⚠ Several VLA weights are likely **non-commercial** — licence audit needed.

> **Sixth idea set:** [`../ai-contest-retail-west/`](../ai-contest-retail-west/README.md) — the **Western market**.
> Regulation-led: **EU AI Act** (emotion-recognition ban live since Feb 2025; Art. 50 transparency and GPAI
> enforcement 2 Aug 2026; content marking 2 Dec 2026; high-risk employment deferred to Dec 2027 *if* the Omnibus
> was adopted), **European Accessibility Act** (in force, **lawsuits already filed**), **Digital Product Passport**.
> Two findings that change earlier plans: **V02 staff scheduling is a HIGH-RISK AI system in the EU**, and the
> **Bossa Nova failure** (Walmart cancelled 500+ store shelf robots) argues for fixed cameras over R01's robot.


Every idea below is written against **the system that actually exists in this monorepo**, not a greenfield.

---

## The one hard constraint: no GPU

The dev server (`10.103.2.40`) and the whole `scripts/docker-compose*.yml` stack are CPU-only. Every
NVIDIA blueprint that needs 4×H100 is therefore **out** in self-hosted form.

The escape hatch is real and is the officially supported default in most blueprints:
**NVIDIA API Catalog / hosted NIM endpoints** (`https://integrate.api.nvidia.com/v1`, `build.nvidia.com`,
OpenAI-compatible). Spring AI 2.0 already talks to OpenAI-compatible endpoints, so `ai-service` can call
Nemotron with a base-URL + API-key change and zero new runtime.

**Rule applied to every idea in this folder:** anything needing local GPU is either dropped, or reduced to
"hosted NIM API only" and labelled with the ceiling it hits.

## Current-system facts the ideas are built on

| Asset | State | Why it matters |
| --- | --- | --- |
| `ai-service` | Spring Boot 4.1, Java 21, **Spring AI 2.0 MCP server (webmvc)**, 3 tools: `get_customer`, `search_product`, `get_product_by_sku` | An MCP server already exists. Ideas extend it instead of starting a Python stack. |
| `pos-mcp` | Separate repo, port 8110, POS menu + draft orders | Second MCP surface, already contracted |
| Kafka + Debezium (`kafka-connect`) | Transactional outbox → CDC relay live | Event feed for anything streaming/agentic |
| Apicurio 3.3.0 | `:8109`, 24 artifacts (order + stock), gate `mvn verify -Pschema-registry` | New AI events must be schema-governed too |
| Postgres | `postgres:16-alpine` | **No pgvector.** Image swap to `pgvector/pgvector:pg16` needed for vector work |
| Elasticsearch | `elasticsearch:7.17.28` | **No native kNN** (8.x feature). NVIDIA RAG's ES backend assumes 8.x |
| Redis | `redis:7-alpine` | Plain Redis — no RediSearch/vector module |
| MinIO | present | Product image store for catalog enrichment |
| Mosquitto (MQTT) | present, POS offline sync uses it | Edge/store device channel (shelf sensors, cameras) |
| OPA (`opa-policy` + `core-components/opa-interceptor`) | live | Authz choke point — reusable as an AI-action policy gate |
| OTel + LGTM | all 19 services, 3 signals | LLM token/cost/latency telemetry lands for free |
| pgpool CQRS | dev `:9999`, read/write split, `goods-service` repointed | Analytical/AI reads can hit the standby, not prod primary |
| Keycloak, Traefik, OpenBao | live | Auth, ingress, secret storage for the NVIDIA API key |
| `workflow-service` | dual-engine, 5 flows parity-tested | Orchestration for AI-triggered business flows |
| `promotion-service` + `core-components/promotion-engine` | offer schema declarative in `offer-schema-labels.xml`, validator choke point | Perfect target for NL→structured-offer generation |

### ⚠️ Port clash to resolve early
`ai-service/README.md` says the MCP server listens on **`:8109`**. On the dev server **Apicurio schema
registry already owns `:8109`**. Pick a new port for `ai-service` before any dev deploy (suggest `:8120`).

---

## The 12 ideas

Ranked by *contest score* = demo impact × feasibility ÷ effort.

| # | Idea | Blueprint source | New infra | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| [01](01-retail-copilot-mcp.md) | **Retail Copilot** — multi-agent shopping + store-staff assistant over existing MCP tools | `retail-shopping-assistant`, `ai-virtual-assistant` | none (hosted NIM) | S–M | ⭐ **Best pick** |
| [02](02-catalog-enrichment.md) | **Catalog Enrichment** — image → SKU title/desc/attributes/FAQ, into the existing SKU draft+audit flow | `Retail-Catalog-Enrichment` | none (hosted NIM + MinIO) | M | ⭐ **Best pick** |
| [03](03-agentic-commerce-acp-ucp.md) | **Agentic Commerce** — expose the storefront as an ACP/UCP merchant so external AI agents can check out | `Retail-Agentic-Commerce` | none | M | ⭐ **Most novel** |
| [04](04-ops-rag-assistant.md) | **Ops RAG** — grounded Q&A over OMS docs + live order/stock data, with citations | `rag`, `ai-virtual-assistant`, `aiq` | pgvector image swap | M | High |
| [05](05-demand-forecast-replenishment.md) | **Forecast & Auto-Replenishment agent** — SKU/store demand → PO suggestions | `Multi-Agent-Intelligent-Warehouse` | none (CPU sklearn) | M–L | High |
| [06](06-promotion-copilot.md) | **Promotion Copilot** — natural language → validated offer JSON | none (native) + `aiq` patterns | none | S | ⭐ **Cheapest win** |
| [07](07-voice-pos-assistant.md) | **Voice POS** — hands-free cashier lookup | `nemotron-voice-agent` | none (cloud ASR/TTS) | M | Medium (VI risk) |
| [08](08-visual-search-3d.md) | **Visual search + 3D PDP** — photo → SKU, 2D → 3D product viewer | `retail-shopping-assistant`, `3d-object-generation` | vector store | M | Medium |
| [09](09-shelf-video-intelligence.md) | **Shelf & store video intelligence** — OOS / queue / shrinkage alerts | `video-search-and-summarization` | **GPU** | L | Low (stretch) |
| [10](10-return-fraud-detection.md) | **Return-abuse & order-anomaly scoring** | `financial-fraud-detection`, `transaction-foundation-model` | GPU for training only | M | Medium |
| [11](11-llm-router-cost-governance.md) | **LLM Router + cost governance** on LGTM dashboards | `llm-router`, `data-flywheel` | 1 container | S | High (force multiplier) |
| [12](12-ai-guardrails-opa.md) | **AI guardrails fused with OPA** | `safety-for-agentic-ai`, NeMo Guardrails | none (hosted NemoGuard) | S–M | High (differentiator) |

### Recommended contest submission

**01 + 02 + 06, wrapped in 11 + 12.**

One coherent story — *"an AI layer on a real production retail platform"* — three visible demos
(shopper chat, catalog auto-fill, promotion authoring), plus router/guardrail plumbing that makes judges
believe it could ship. Total: ~4–6 weeks for one or two engineers, zero new GPUs, zero rewrites.

Add **03** if the contest rewards novelty over polish — ACP/UCP is brand new and almost nobody will
have a real merchant backend to plug into it. This monorepo does.

---

## Diagrams

Each diagram ships as `.drawio` (source), `.drawio.png` (2× raster, XML embedded — reopen it in draw.io to
edit) and `.svg` (vector, for slides). Colour code is identical across all six: green = new AI component,
red = GPU-blocked, purple = existing service, yellow = existing data/platform, NVIDIA-green = hosted NIM.

| Diagram | File |
| --- | --- |
| Solution landscape — all 12 ideas over the current architecture | `diagrams/landscape.drawio.png` |
| Idea 01 — Retail Copilot | `diagrams/idea-01-retail-copilot.drawio.png` |
| Idea 02 — Catalog Enrichment pipeline | `diagrams/idea-02-catalog-enrichment.drawio.png` |
| Idea 03 — Agentic Commerce (ACP/UCP) | `diagrams/idea-03-agentic-commerce.drawio.png` |
| Idea 04 — Ops RAG | `diagrams/idea-04-ops-rag.drawio.png` |
| Idea 05 — Forecast & Replenishment | `diagrams/idea-05-forecast-replenishment.drawio.png` |

## Shared prerequisites (do these once, they unlock 01–08, 11, 12)

1. **NVIDIA API key** — `build.nvidia.com` account, key stored in **OpenBao** (not `application.properties`),
   surfaced as `NVIDIA_API_KEY`.
2. **`ai-service` port move** off `:8109` (Apicurio clash).
3. **Spring AI chat client** in `ai-service` — add `spring-ai-starter-model-openai`, point
   `spring.ai.openai.base-url=https://integrate.api.nvidia.com/v1`. Nemotron is OpenAI-compatible; no new
   dependency family, no Python service.
4. **Egress check** — dev server must reach `integrate.api.nvidia.com` through the corporate MITM proxy.
   This is the single most likely blocker; test it on day one with a `curl` before writing code.
   (Same MITM class of problem already hit Harness clone and the OTel proxy — see prior notes.)
5. **Vector store decision** (only for 02/04/08): swap `postgres:16-alpine` →
   `pgvector/pgvector:pg16` in `scripts/docker-compose.yml`. That is an **infra** change, not dev/qa config,
   so it does belong in compose — but coordinate it, `scripts/` is managed locally and not deployed from here.
