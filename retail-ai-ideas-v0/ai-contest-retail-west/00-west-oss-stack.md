# Western open-source stack — and the licence pattern that matters more than any model

**Verify every licence in the repo's own LICENSE file before shipping.** Items marked ⚠ are from general
knowledge rather than a verified 2026 source in this research round — treat them as a starting point for a
check, not as a citation.

Snapshot: July 2026.

---

## 0 · The pattern to understand first: Western OSS relicensing

The distinctive licence risk in the Western stack is **not** non-commercial weights (that was the China
round's trap — IDM-VTON, InsightFace). It is **infrastructure projects changing licence after you depend
on them**:

| Project | What happened | ⚠ |
| --- | --- | --- |
| **HashiCorp Terraform** | BSL in Aug 2023 → community forked **OpenTofu** (Linux Foundation) | verify current state |
| **Redis** | RSALv2/SSPLv1 in Mar 2024 → **AGPLv3 added with Redis 8 (2025)**; forks **Valkey** (LF) exist | verify |
| **Elasticsearch** | SSPL in 2021 → **AGPL added Aug 2024**; fork **OpenSearch** (now LF) | verify |
| **MongoDB** | SSPL since 2018 | verify |
| **Grafana** | AGPL since 2021 | verify |

**We already depend on Redis, Elasticsearch and Grafana.** None of that is a problem for internal use —
but it is exactly the class of thing a licence register exists to track, and it is a better slide than
listing model names.

**Design rule that falls out of it:** prefer **Apache-2.0 / MIT / BSD projects under a foundation**
(CNCF, LF AI & Data, Apache) over single-vendor open core. OPA, OpenTelemetry, Milvus, Open-RMF and
OpenTofu are all in that category; that is why they show up repeatedly across these six folders.

## 1 · Text LLMs — the Western options and their licence shapes

| Model | Licence | Note |
| --- | --- | --- |
| **Phi** (Microsoft) | **MIT** ⚠ verify per checkpoint | cleanest licence in the Western small-model space |
| **OLMo** (AI2) | **Apache-2.0**, and *fully* open — weights **and training data** ⚠ | the only genuinely OSI-shaped option; matters if the EU AI Act ever asks about training-data provenance |
| **SmolLM / SmolVLA** (Hugging Face) | Apache-2.0 ⚠ | small, reproducible, trained on public data |
| **Gemma** (Google) | **Gemma Terms — not an OSI licence** | a use policy with restrictions. Read it; don't assume "open weights" means Apache |
| **Llama** (Meta) | **Llama Community Licence** — ⚠ commercial use gated above a monthly-active-user threshold (reported ~700M) | fine for us, but it is a *conditional* licence and belongs in the register as such |
| **Mistral** | **mixed** — some models Apache-2.0, others under the **Mistral Research Licence** ⚠ | per-model check is mandatory; the family name tells you nothing |

**Recommendation for this set:** the Chinese models chosen in sets 4–5 (**Qwen3.6 Apache-2.0**,
**DeepSeek MIT**, **GLM MIT**) have *cleaner* licences than most Western equivalents, and
**US export restrictions target advanced GPU sales to China but do not restrict use of open-source Chinese
model weights** — so deploying them on EU/US infrastructure is unrestricted (see
[`../ai-contest-retail-china/00-oss-round2-additions.md`](../ai-contest-retail-china-r2/00-oss-round2-additions.md) §4).

⚠ **But there is a Western-specific counter-argument worth stating**: for an EU deployment,
**model provenance may become a procurement question** independent of licence. Some buyers will ask.
Have both answers ready — the licence answer and the sovereignty answer.

## 2 · Serving & inference

| Component | Licence | Note |
| --- | --- | --- |
| **vLLM** | Apache-2.0 ⚠ | the default high-throughput server; already referenced as tier 1 in [V12](../ai-contest-retail-vti/V12-local-model-gateway.md) |
| **llama.cpp** | MIT ⚠ | CPU/edge, GGUF |
| **Ollama** | MIT ⚠ | developer ergonomics; what the VTI set standardised on |
| **Text Generation Inference** (HF) | Apache-2.0 ⚠ — **note this project changed licence and changed back**; check the version you pin | |

## 3 · Orchestration, RAG and agents

| Component | Licence | Fit |
| --- | --- | --- |
| **LangChain / LangGraph** | MIT ⚠ | the default in Western reference architectures — and what most NVIDIA blueprints in set 1 use |
| **LlamaIndex** | MIT ⚠ | retrieval-centric |
| **Haystack** (deepset, Germany) | Apache-2.0 ⚠ | **EU-origin**, which is occasionally a procurement point in public-sector-adjacent retail |
| **MCP** (Anthropic) | open specification | **already in production here** — `ai-service` is a Spring AI MCP server |
| **ACP** (OpenAI + Stripe) · **AP2** (Google → **FIDO Alliance**, Apr 2026) · **UCP** | open specs | → [W03](W03-multi-protocol-agentic-commerce.md) |

**We do not need LangChain.** Spring AI 2.0 in `ai-service` already gives the tool-calling loop, and the
Java stack avoids a language boundary — the same argument made in
[`N-01`](../ai-contest-retail/01-retail-copilot-mcp.md). Listing it here is for completeness, not adoption.

## 4 · Vector search

| Component | Licence | Verdict for us |
| --- | --- | --- |
| **pgvector** | PostgreSQL licence ⚠ | ✅ **still the choice** — one image swap, joins against business tables, comfortable to ~10⁶ vectors |
| **FAISS** (Meta) | MIT ⚠ | in-process, what PaddleClas ships with |
| **Qdrant** | Apache-2.0 ⚠ (open core: cloud features separate) | if a dedicated service is ever needed |
| **Weaviate** | BSD-3 ⚠ | " |
| **Chroma** | Apache-2.0 ⚠ | prototyping |
| **Milvus** | **Apache-2.0, LF AI & Data graduated** (verified in round 2) | the best-*governed* option; only needed past ~10⁷ vectors |

## 5 · Speech

| Component | Licence | Note |
| --- | --- | --- |
| **Whisper** (OpenAI) | MIT ⚠ | the Western baseline. **Weaker than PhoWhisper on Vietnamese and than SenseVoice/Fun-ASR on Chinese** — the earlier folders chose better for those languages |
| **faster-whisper** (CTranslate2) | MIT ⚠ | int8 CPU inference — what makes Whisper-class models viable without a GPU |
| **Piper** | MIT ⚠ | tiny, fast CPU TTS, many EU languages |
| **Coqui TTS** | MPL-2.0 ⚠ — **the company shut down**; community-maintained | a good example of *maintenance risk* belonging in the register alongside licence risk |

## 6 · Accessibility — the toolchain nobody lists, and the one with a court date

Directly serves [W02](W02-accessibility-remediation-copilot.md) and the EAA obligations in
[`00-west-regulation.md`](00-west-regulation.md) §2.

| Tool | Licence | Role |
| --- | --- | --- |
| **axe-core** (Deque) | **MPL-2.0** ⚠ — file-level copyleft, read it | the de-facto automated WCAG rule engine; what most commercial scanners wrap |
| **Pa11y** | LGPL-3.0 ⚠ | CI-friendly runner |
| **Lighthouse** (Google) | Apache-2.0 ⚠ | accessibility score in CI, alongside performance |
| **IBM Equal Access Accessibility Checker** | Apache-2.0 ⚠ | second opinion; different rule set catches different things |

⚠ **The honest limit, and it must be in the deck:** automated tools catch roughly **a third** of WCAG
issues. Keyboard traps, focus order, meaningful alt text and screen-reader flow need manual testing. A plan
that claims automated scanning = compliance is wrong, and the EAA lawsuits already filed in France will
not be won by a Lighthouse score.

## 7 · Data, MLOps and governance — the boring layer that satisfies Article 26

| Component | Licence | Why it's here |
| --- | --- | --- |
| **OpenTelemetry** | Apache-2.0, **CNCF** | already deployed on 19 services; the log/trace substrate for AI Act event logging |
| **OPA** | Apache-2.0, **CNCF graduated** | already deployed; the enforcement point for AI action authorisation ([N-12](../ai-contest-retail/12-ai-guardrails-opa.md)) |
| **MLflow** | Apache-2.0 ⚠ | model registry + versioning → the AI Act **technical documentation** obligation |
| **Evidently** | Apache-2.0 ⚠ | drift and **fairness/slice metrics** → the **discriminatory-impact monitoring** obligation |
| **Great Expectations** | Apache-2.0 ⚠ | data quality gates → feeds [I05](../ai-contest-retail-industry/I05-product-data-quality.md) and DPP readiness |
| **Feast** | Apache-2.0 ⚠ | feature store, if the forecasting/pricing work grows |
| **Airflow / Dagster** | Apache-2.0 ⚠ | we already have `workflow-service`; only relevant if a data-engineering team wants their own |
| **DuckDB** | MIT ⚠ | the analytical escape hatch in [V11](../ai-contest-retail-vti/V11-analytics-copilot.md) |
| **dbt-core** | Apache-2.0 ⚠ | if the reporting views in I01/I03/V11 grow into a modelled warehouse |

**The mapping worth putting on a slide:**

```
EU AI Act Article 26 obligation        →  component we already run
────────────────────────────────────────────────────────────────
automatic event logging, ≥6 months     →  ai_decision (I06) + OpenTelemetry
operational human oversight controls   →  I06 human_action + OPA gate (N-12)
technical documentation                →  MLflow model registry + model register
discriminatory-impact monitoring       →  Evidently slice metrics
incident reporting 24h/72h/15d         →  one incident record, three routes  (W01)
```

## 8 · Forecasting, optimisation, vision, robotics — unchanged from earlier folders

Already chosen and unchanged, because they were chosen on licence and CPU-viability, not on geography:

**Chronos-2** (Amazon, Apache-2.0, CPU) · **OR-Tools** (Google, Apache-2.0) ·
**RT-DETRv2** (Apache-2.0) + **ByteTrack** (MIT) · **PaddleClas PP-ShiTuV2** (Apache-2.0) ·
**bge-m3** (MIT) · **ROS 2 / Nav2 / Open-RMF / Gazebo** (Apache-2.0 family) ·
**LeRobot** (Hugging Face, Apache-2.0 ⚠).

❌ **Still excluded, same reasons:** Ultralytics YOLO (AGPL-3.0 network clause), InsightFace weights
(non-commercial), IDM-VTON (CC BY-NC-SA), FLUX Kontext Dev (non-commercial), MiniMax M3 (restricted),
several VLA weights (unverified, likely restricted).

## 9 · Licence register — Western additions

Add these rows to the register required by
[I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md):

| Component | Licence | Commercial | Note |
| --- | --- | --- | --- |
| Phi · OLMo · SmolLM | MIT / Apache-2.0 ⚠ | ✅ | OLMo also publishes training data |
| **Llama** | **Community Licence** ⚠ | ⚠ **conditional** — MAU threshold | record it as conditional, not as open |
| **Gemma** | **Gemma Terms** | ⚠ not OSI | use policy with restrictions |
| **Mistral** | **mixed per model** ⚠ | ⚠ per-model check | Research Licence on some |
| vLLM · llama.cpp · Ollama | Apache-2.0 / MIT ⚠ | ✅ | |
| LangChain · LlamaIndex · Haystack | MIT / Apache-2.0 ⚠ | ✅ | not adopted — Spring AI covers it |
| pgvector · FAISS · Chroma · Weaviate · Qdrant | permissive ⚠ | ✅ | open-core caveats on the hosted tiers |
| **axe-core** | **MPL-2.0** ⚠ | ✅ with obligations | file-level copyleft |
| Pa11y | LGPL-3.0 ⚠ | ✅ with obligations | |
| Whisper · faster-whisper · Piper | MIT ⚠ | ✅ | |
| **Coqui TTS** | MPL-2.0 ⚠ | ✅ | ⚠ **maintenance risk — company shut down** |
| MLflow · Evidently · Great Expectations · Feast · dbt-core | Apache-2.0 ⚠ | ✅ | |
| OpenTelemetry · OPA | Apache-2.0, CNCF | ✅ | already deployed |
| **Redis · Elasticsearch · Grafana** | **relicensed since 2021–2025** ⚠ | ✅ for our use | **the relicensing pattern — track it** |

## 10 · What this round did not verify

Recording the gaps is part of the deliverable:

- Exact current licence text for **every** row marked ⚠ — this round's searches covered regulation,
  robotics and agentic commerce, not per-repo LICENSE files.
- **Llama's current MAU threshold** and whether it changed in 2026.
- **Mistral's per-model split** as of 2026.
- Whether **EN 301 549 v4.1.1** (incorporating WCAG 2.2) has actually published.
- Whether the **EU DPP registry** launched in July 2026 as one source indicated.
- Whether the **AI Act Digital Omnibus was formally adopted before 2 August 2026** — this one materially
  changes [W07](W07-compliant-workforce-ai.md)'s timeline.

**The last item is the one to check first.** It is a single question with a yes/no answer that moves a
compliance deadline by 16 months.
