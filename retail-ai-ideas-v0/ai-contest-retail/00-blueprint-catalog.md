# NVIDIA-AI-Blueprints — full inventory & retail verdict

All **37** public repos in the org, July 2026 snapshot. Verdict column = usefulness for a retail AI contest
entry built on *this* monorepo (CPU-only infra, Java/Spring backend, Angular frontends).

Legend — 🟢 use it · 🟡 usable with real work / partial · 🔴 wrong domain or infeasible here · ⚫ deprecated upstream

| # | Repo | What it is | Retail fit | Verdict |
| --- | --- | --- | --- | --- |
| 1 | **retail-shopping-assistant** | LangGraph multi-agent shopping advisor: catalog retriever, memory/cart agent, guardrails, React UI, streaming. Nemotron 3 Super 120B / Llama 3.1 70B, NV-EmbedQA-E5-v5, NV-CLIP, NemoGuard 8B. Milvus. 4×H100 self-hosted **or NGC API (no GPU)** | Direct | 🟢 → [Idea 01](01-retail-copilot-mcp.md), [08](08-visual-search-3d.md) |
| 2 | **Retail-Catalog-Enrichment** | Image → multilingual titles/descriptions, cultural image variants, quality scoring, 3D asset, FAQ, compliance-RAG, ACP/UCP schema export. Nemotron 3 Nano Omni + Nano, nv-embedqa-e5-v5, FLUX Kontext Dev, TRELLIS. Hosted/self-hosted/hybrid | Direct | 🟢 → [Idea 02](02-catalog-enrichment.md) |
| 3 | **Retail-Agentic-Commerce** | Reference impl of **ACP** (REST checkout sessions + webhooks) and **UCP** (A2A JSON-RPC, `.well-known/agent-card.json`). Merchant API :8000, PSP :8001, Apps-SDK MCP :2091, NAT agents for promo/reco/search/post-purchase. Nemotron-Nano-30B-A3B. **Default = public NVIDIA endpoints, no GPU** | Direct | 🟢 → [Idea 03](03-agentic-commerce-acp-ucp.md) |
| 4 | **Multi-Agent-Intelligent-Warehouse** | 5 agents (equipment, ops coordination, safety, **forecasting**, doc processing). LangGraph + MCP tool discovery. Forecast ensemble RF/XGBoost/GBM/Ridge/SVR with RAPIDS accel and **CPU fallback**. Postgres/TimescaleDB, Milvus, Redis. WMS/ERP integrations | Warehouse ≈ IMS/stock | 🟢 → [Idea 05](05-demand-forecast-replenishment.md) |
| 5 | **rag** | Foundational RAG: LangChain orchestrator, NeMo Retriever Extraction (tables/charts/OCR), **Elasticsearch default** or Milvus, hybrid dense+sparse + rerank, citations, agentic plan-and-execute, guardrails, OpenAI-compatible API. Nemotron-3-super-120b, llama-nemotron-embed-1b-v2, llama-nemotron-rerank-1b-v2 | Ops/CS knowledge base | 🟢 → [Idea 04](04-ops-rag-assistant.md) — note ES default needs 8.x, we run 7.17 |
| 6 | **llm-router** | Prompt classifier (Triton) routes each request to the cheapest adequate model. `task_router` + `complexity_router`. OpenAI-compatible proxy with `nim-llm-router` metadata. 1 GPU (V100/4GB) for bundled routers | Cost control for all AI features | 🟢 → [Idea 11](11-llm-router-cost-governance.md) |
| 7 | **safety-for-agentic-ai** | NeMo Guardrails runtime protection + `garak` vuln scanning + NemoGuard content safety. 8×H100 for the self-hosted main LLM | Guardrails for customer-facing chat | 🟢 (guardrails only, hosted NemoGuard) → [Idea 12](12-ai-guardrails-opa.md) ⚫ deprecated Apr 2026, use NeMo Microservices |
| 8 | **aiq** | Enterprise research agent on **NeMo Agent Toolkit** + LangChain Deep Agents. Intent classification → shallow vs deep researcher, citation management. Nemotron-3-Nano-30B, GPT-OSS-120B, Nemotron-Mini-4B. **No GPU with hosted API Catalog** | Pattern source for agent orchestration + citations | 🟢 pattern reuse in [04](04-ops-rag-assistant.md), [06](06-promotion-copilot.md) |
| 9 | **nemotron-voice-agent** | End-to-end voice: ASR (Nemotron Streaming / Parakeet CTC / Parakeet Multilingual) → LLM (Nemotron 3 Nano/Super/Omni) → TTS (Magpie Multilingual). Pipecat, WebRTC :7860, sub-second latency. **Cloud profile = CPU-only** | Cashier / call-centre | 🟡 → [Idea 07](07-voice-pos-assistant.md) — Vietnamese ASR/TTS quality is the open risk |
| 10 | **video-search-and-summarization (VSS)** | Vision agents over stored + streamed video. Cosmos3 Nano Reasoner VLM + Nemotron-Nano-9B-v2. CV pipeline (detect/track/behaviour), alert verification to cut false positives, REST APIs over **Elasticsearch**, MCP for search/Q&A/clip retrieval | Shelf OOS, queue length, shrinkage | 🟡 → [Idea 09](09-shelf-video-intelligence.md) — needs real GPU; demo-on-clips only |
| 11 | **3d-object-generation** | 2D/text → 3D asset generation | 3D product viewer on PDP | 🟡 → [Idea 08](08-visual-search-3d.md) (also embedded inside blueprint #2 via TRELLIS) |
| 12 | **financial-fraud-detection** | GNN fraud scoring + Shapley explainability, served on Dynamo-Triton. Synthetic tx dataset. **1 GPU ≥32GB required**, fully local, no NVIDIA cloud | Payment / return abuse | 🟡 → [Idea 10](10-return-fraud-detection.md) — GPU for training; ship CPU baseline |
| 13 | **transaction-foundation-model** | Tokenises tabular transactions, pretrains a ~29M-param Llama-style decoder, exports 512-d embeddings for fraud/segmentation/personalisation. RAPIDS tokeniser. 1×A100/H100 | Customer segmentation from order history | 🟡 → [Idea 10](10-return-fraud-detection.md) stretch goal |
| 14 | **data-flywheel** | Mines production LLM logs, auto-builds eval + fine-tune sets, tests base / ICL / fine-tuned candidates, LLM-as-judge scoring. Reported up to **98.6% inference-cost cut** on simple tasks. ES + MongoDB + Redis + Celery. 6×H100 self-hosted eval | Cost optimisation once AI is in prod | 🟡 concept only → [Idea 11](11-llm-router-cost-governance.md) ⚫ deprecated Apr 2026 |
| 15 | **ai-virtual-assistant** | Customer-service chatbot: LangGraph 3 sub-agents, **structured retriever (Postgres + Vanna.AI text-to-SQL)** + unstructured retriever (Milvus), conversation analytics + sentiment, feedback APIs. Llama 3.3 70B, Nemotron embed/rerank 1B v2 | Direct (CS) | 🟡 → [Idea 01](01-retail-copilot-mcp.md), [04](04-ops-rag-assistant.md) ⚫ deprecated Apr 2026 — copy the text-to-SQL + analytics pattern, not the code |
| 16 | **content-localization** | Video/audio dubbing: 3rd-party S2S (ElevenLabs / Camb.ai) + NVIDIA ASD and LipSync NIM containers. GPU + CUDA 12.x, no hosted option | Localising product videos / training content | 🔴 GPU-bound, 3rd-party paid, marginal retail value |
| 17 | **streaming-data-to-rag** | Live stream → transcribe → embed → index, demoed on FM radio via Holoscan SDR (UDP I/Q, **not Kafka**). Milvus + Neo4j, Parakeet 0.6b ASR, Nemotron Nano 9b | Concept maps to our Kafka CDC → RAG | 🟡 idea-level only; the SDR half is irrelevant |
| 18 | **pdf-to-podcast** | PDF → scripted AI audio | Internal training/comms from SOPs | 🔴 fun, not retail-differentiating |
| 19 | **digital-human** | Avatar/embodied assistant | In-store kiosk avatar | 🔴 heavy GPU, kiosk hardware we don't have |
| 20 | **portfolio-optimization** | Mean-CVaR / Mean-Variance with cuOpt | — | 🔴 finance |
| 21 | **quantitative-signal-discovery-agent** | Trading-signal discovery agent | — | 🔴 finance |
| 22 | **ai-model-distillation-for-financial-data** | Distillation for finance | — | 🔴 finance |
| 23 | **genomics-analysis** | Genomics pipeline | — | 🔴 healthcare |
| 24 | **single-cell-analysis-blueprint** | scRNA-seq analysis | — | 🔴 healthcare |
| 25 | **biomedical-aiq-research-agent** | Biomedical research agent | — | 🔴 healthcare |
| 26 | **ambient-healthcare-agents** | Ambient clinical agents | — | 🔴 healthcare |
| 27 | **ambient-patient** | Patient-side ambient agent | — | 🔴 healthcare |
| 28 | **ambient-provider** | Provider-side ambient agent | — | 🔴 healthcare |
| 29 | **vulnerability-analysis** | GenAI triage of container CVEs | Could plug into Harness CI / SonarQube | 🟡 off-domain for a *retail* contest, but a genuine internal win |
| 30 | **securing-agentic-ai-developer-day** | Workshop material for taking agentic workflows to prod securely | Reference reading for [Idea 12](12-ai-guardrails-opa.md) | 🟡 docs only |
| 31 | **goose** | Extensible open-source coding agent (Block's goose, mirrored) | Dev tooling | 🔴 not a product idea |
| 32 | **pydantic-ai** | Python agent framework (mirror) | — | 🔴 framework mirror, and we're Java |
| 33 | **hermes-agent** | Adaptive personal agent system | — | 🔴 vague, no retail hook |
| 34 | **nsight-copilot** | AI copilot for NVIDIA Nsight profiling | — | 🔴 GPU dev tooling |
| 35 | **nim-usage-scanner** | Rust static analyser cataloguing NIM usage across repos | Governance if we adopt many NIMs | 🔴 not contest material |
| 36 | **bring-llms-to-nim** | How to package a custom model as a NIM | Only if we self-host later | 🔴 no GPU |
| 37 | **3d-guided-genai-rtx** | RTX-local 3D-guided image generation | Product photography | 🔴 needs RTX workstation |

## Counts

- 🟢 directly usable: **8** (#1–#8)
- 🟡 partially usable / pattern-only: **9**
- 🔴 out of scope: **20**
- ⚫ upstream-deprecated among the useful ones: `ai-virtual-assistant`, `safety-for-agentic-ai`, `data-flywheel`
  → treat these three as **design references**, never as dependencies. Their live successor is
  **NeMo Microservices** / **NeMo Agent Toolkit**.

## Cross-cutting technical observations

1. **Everything converges on LangGraph + MCP.** Blueprints #1, #3, #4, #8, #15 all orchestrate with
   LangGraph and expose/consume MCP tools. `ai-service` is already an MCP server — so we can keep our
   business logic in Java and only add a thin agent layer, or even skip the Python layer entirely by using
   Spring AI's own tool-calling loop.
2. **Milvus is the default vector DB** in #1, #4, #15, #17. We have neither Milvus nor pgvector nor ES-kNN.
   One decision unblocks four ideas: `pgvector/pgvector:pg16` (cheapest, no new service) vs
   `milvus-standalone` (blueprint-compatible, new container + etcd + MinIO — MinIO we already have).
   **Recommendation: pgvector.** Catalogue-scale retail vectors (10⁵–10⁶ SKUs) are trivially served by it.
3. **NV-CLIP is deprecated on the cloud API** — so blueprint #1's image search only works with a *local*
   NV-CLIP NIM. Visual search ([Idea 08](08-visual-search-3d.md)) must substitute a different multimodal
   embedder or be scoped to a GPU-optional stretch.
4. **ACP/UCP is the newest thing in the org** (#3, and #2 exports to those schemas). Standing up an
   ACP-compliant merchant on a real OMS is the highest-novelty, lowest-competition angle available.
5. **Hosted NIM covers LLM + embedding + rerank + safety.** It does **not** cover: FLUX image generation
   (non-commercial licence), TRELLIS 3D, NV-CLIP, VSS's CV pipeline, GNN fraud training. Those are the
   GPU-locked pieces, and they map exactly to the 🟡/🔴 ideas.
