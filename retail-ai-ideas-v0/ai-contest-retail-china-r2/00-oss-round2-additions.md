# Open-source round 2 — non-robot additions

Components found in round 2 that were **not** in
[`../ai-contest-retail-china/00-china-oss-stack.md`](../ai-contest-retail-china/00-china-oss-stack.md).
Robotics components live in [00-robotics-oss-stack.md](00-robotics-oss-stack.md).

**Verify every licence in the repo's LICENSE file.** Items marked ⚠ could not be confirmed from the
sources searched.

---

## 1 · Vector database — Milvus

| | |
| --- | --- |
| Repo | [milvus-io/milvus](https://github.com/milvus-io/milvus) |
| Licence | **Apache-2.0** ([LICENSE](https://github.com/milvus-io/milvus/blob/master/LICENSE)) |
| Origin | Developed by **Zilliz**, donated to the **LF AI & Data Foundation** (Linux Foundation) — incubation Jan 2020, **graduated June 2021** |
| Stack | Go + C++; Linux and macOS, x86 and ARM |
| Contributors | Zilliz, ARM, NVIDIA, AMD, Intel, Meta, IBM, Salesforce, Alibaba, Microsoft |
| Versions | stable **v2.6.16** (May 2026); **v3.0.0-beta** preview, which introduces forks of third-party similarity-search libraries such as **Faiss** |

**Where it fits for us:** we chose **pgvector** in the earlier folders and that decision stands for
10³–10⁶ vectors — one image swap, no new service, joins against business tables for free. Milvus becomes
the right answer only if [C05](../ai-contest-retail-china/C05-product-recognition-shelf-checkout.md)'s SKU
image gallery grows past ~10⁷ embeddings, or if a vendor stack we integrate already ships it
(**源雀 Iyque-SCRM uses Milvus for its RAG knowledge base** — that is an existing dependency, not a new choice).

Being a **graduated Linux Foundation project under Apache-2.0** makes it the cleanest-governed component in
any of the five folders. Worth one line in the licence-register slide.

## 2 · Model serving — Xinference

| | |
| --- | --- |
| Repo | [xorbitsai/inference](https://github.com/xorbitsai/inference) |
| Licence | ⚠ **verify** — has a self-hosted **Community Edition plus a separate enterprise offering** |
| What it is | Serves **language, speech-recognition and multimodal** models through **one unified inference API** — cloud, on-prem or laptop, deployed with a single command |

Features that matter here:
- **auto-batching** of concurrent requests
- **Xllamacpp** — a llama.cpp Python binding maintained by the Xinference team, **supporting continuous batching**
- **distributed inference across workers**; vLLM enhancements incl. **shared KV cache across replicas**
- **v3.0.0** released with migration notes and breaking changes
- integrates with **Xagent** for dynamic planning, tool use and multi-step reasoning

**Why it's interesting for the China set:** it serves **LLM + ASR + multimodal behind one API**. Set 4
needs Qwen3.6 (chat), Fun-ASR (speech) and a VLM (images) served domestically — Xinference collapses three
serving stacks into one. That is a real reduction in moving parts versus running Ollama + a FastAPI sidecar
+ vLLM separately.

⚠ **But check the Community/enterprise split before depending on it.** An open-core product with a paid
edition is exactly the shape that bites later. Compare against plain **vLLM** (Apache-2.0) before adopting.

## 3 · On-device multimodal — MiniCPM (OpenBMB)

| | |
| --- | --- |
| Repo | [OpenBMB/MiniCPM-V](https://github.com/openbmb/MiniCPM-V) |
| Licence | **Apache-2.0** (per tracked releases — verify per checkpoint) |
| Origin | **OpenBMB** (Open Lab for Big Model Base), co-founded by Tsinghua NLP researchers and **ModelBest / 面壁智能**, Beijing |

- **MiniCPM-V 4.6** (11 May 2026): mixed **4×/16× visual token compression at 1.3B scale**; described as
  their most edge-deployment-friendly model, with roughly **1.5× token throughput vs Qwen3.5 0.8B**.
- **MiniCPM-o 4.5** (Feb 2026): **full-duplex multimodal live streaming**.
- *"MiniCPM remains the reference point for genuinely small on-device models where a 36B MoE is too heavy."*

**Where it fits:** the **edge box**. [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) and
[R01](R01-shelf-scanning-robot.md) both want a VLM verification pass *on the box*, not in the datacentre —
a 1.3B multimodal model with aggressive token compression is exactly that shape. And the **full-duplex
streaming** variant is a candidate for the interaction half of
[C01 digital-human livestream](../ai-contest-retail-china/C01-digital-human-livestream.md), which currently
has no real-time path.

## 4 · Licensing landscape — the 2026 summary worth keeping

From the round-2 sources, stated compactly:

| Model | Licence |
| --- | --- |
| Qwen3 | **Apache-2.0** |
| DeepSeek | **MIT** |
| MiniMax-Text-01 | MIT |
| GLM-4-9B | Apache-2.0 |
| InternLM2 | Apache-2.0 |
| Baichuan2 | commercial use **below 100M MAU** |
| ERNIE 4.0, Kimi | **proprietary, API-only** |

One source calls the licence question *"largely settled"* with Qwen3 and DeepSeek fully permissive;
another counters that **licences have fragmented and need per-model verification**. Both are right in
different places — which is precisely why the register exists.

**A useful, non-obvious fact:** *US export restrictions target advanced GPU sales to China but do not
restrict use of open-source Chinese model weights* — so deploying DeepSeek or Qwen on US/EU infrastructure
is unrestricted. That matters for the **📘 PLAYBOOK** reading of the China set: we can use the Chinese
stack for a Vietnamese deployment with no export issue.

⚠ Counterweight from the same sources: **infrastructure is now the binding constraint** —
*Qwen3-235B-A22B at full precision requires 4×H100*, and MoE (22B active) helps but does not remove the
hardware demand. Our GPU-free constraint still points at the small end: Qwen3.6-35B-A3B, MiniCPM-V,
Fun-ASR-Nano.

Sources: [RadarAI — China open-source models, Apache/MIT 2026](https://radarai.top/en/china-ai-open-source-models) ·
[IntuitionLabs — overview of Chinese open-source LLMs](https://intuitionlabs.ai/articles/chinese-open-source-llms-2025) ·
[LLMReference — OpenBMB](https://www.llmreference.com/researcher/openbmb) ·
[index.dev — top 5 Chinese open-source LLMs 2026](https://www.index.dev/blog/chinese-open-source-llm-models)

## 5 · Gaps this round did not close

Named in the search but **not resolved** — treat as open questions, don't cite:

| Project | What it is | Status |
| --- | --- | --- |
| **LMDeploy** | InternLM's inference/serving toolkit | ⚠ licence and current capability **unverified** |
| **MaxKB** | 1Panel / FIT2CLOUD knowledge-base Q&A | ⚠ **unverified**; overlaps RAGFlow, which is already Apache-2.0 and chosen |
| **RoboBrain (BAAI)** | embodied reasoning model | ⚠ **did not surface** — needs a dedicated search before any claim |
| **AimRT licence** | AgiBot's ROS-compatible runtime | ⚠ **unverified** — check before adopting over plain ROS 2 |
| **Chinese in-store 盘点机器人 vendors** | shelf-scanning robot suppliers in China | ⚠ Chinese sources focused on **warehouse** counting robots and RFID, not in-store shelf robots. Simbe/Tally is US. **If a China-market shelf robot is needed, the vendor list is an open procurement question.** |
| **ESL vendors** (Hanshow, VusionGroup, 汉朔) | electronic shelf labels | ⚠ market size found (>$2.5B global 2026), **vendor detail not** |

Recording what we **could not** verify is part of the deliverable. It is also the honest answer to
"did you check?" — and it tells whoever builds this where to spend the first hour.
