# AI Contest — Retail Ideas, VTI solution catalogue × open-source models

Second idea set. Source of inspiration: **<https://vti.com.vn/retail-software-solutions/>** — a Vietnamese
retail software house's actual product/service catalogue, including five published case studies.

**Model policy for this set (deliberately different from the NVIDIA set):**
open-weight models served locally via **Ollama** or pulled from **Hugging Face**, with a
**MiniMax API key as the single commercial escape hatch** for the hard turns.

| | NVIDIA set (`../ai-contest-retail/`) | This set |
| --- | --- | --- |
| Inspiration | NVIDIA AI Blueprints (37 repos) | VTI retail catalogue + case studies |
| Models | NVIDIA hosted NIM (Nemotron, NemoGuard) | Ollama / HF open weights + MiniMax API |
| Where inference runs | NVIDIA cloud only | **on our own server first**, cloud only on escalation |
| Data leaves the building | yes, every prompt | only escalated, PII-stripped prompts |
| Cost shape | per-token, always | ~0 for the local tier, per-token on escalation |
| Language strength | Nemotron multilingual, VI untested | **PhoWhisper / bge-m3 / Vietnamese-tuned models** |

> **Third idea set available:** [`../ai-contest-retail-industry/`](../ai-contest-retail-industry/README.md) —
> 8 industry articles read for **market consensus + gap fill**. Its
> [consensus matrix](../ai-contest-retail-industry/00-consensus-matrix.md) scores 26 retail AI use cases
> against 8 sources and shows which of them these plans already cover. Read it before choosing what to build:
> it adds 8 plans for genuine gaps (pricing/markdown, waste, assortment, returns prevention, product data
> quality, AI governance, proactive service, routing) and confirms the picks here are aimed at what the
> market has converged on.

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

Companion documents:

- [00-vti-solution-catalog.md](00-vti-solution-catalog.md) — every item on the VTI page, mapped or rejected
- [00-model-stack.md](00-model-stack.md) — the full open-model catalogue: licence, size, CPU viability,
  Ollama tag / HF repo, plus the 3-tier routing policy and data-residency rules

---

## Why "open weights first" is a better story here than in the NVIDIA set

1. **Data residency.** Retail data is customer PII, prices, margins and supplier terms. Vietnam's
   Decree 13/2023/ND-CP and the Personal Data Protection Law in force from 2026 make "we send every
   customer message to a US GPU cloud" a question you have to answer. *"The default tier never leaves the
   rack"* answers it. (Confirm current obligations with legal — this is a design argument, not advice.)
2. **Cost floor of zero.** A demo whose marginal cost is 0 VND per query is a different conversation from
   one that bills per token. The MiniMax tier exists for the ~5–15% of turns that genuinely need it.
3. **Vietnamese actually works.** The NVIDIA set had to hedge on Vietnamese. This one doesn't:
   **PhoWhisper** (VinAI, 844h, 26k speakers, 63 provinces) for ASR and **bge-m3** for retrieval are
   Vietnamese-first and beat any generalist model available through a hosted API.
4. **No vendor lock.** Ollama, vLLM and MiniMax are all OpenAI-compatible. `ai-service` already uses
   Spring AI 2.0 — switching tier is a base-URL and model-name change, nothing else.

## The one hard constraint, again: no GPU

Same finding as the NVIDIA set — the dev server (`10.103.2.40`) and the whole compose stack are CPU-only.
Consequences for *this* set are different and mostly better:

| | Effect |
| --- | --- |
| LLM | CPU Ollama caps you at ~4B class (`qwen3.5:4b-q4_K_M`, `gemma4:e4b`). Enough for extraction, classification, routing, structured output. **Not** enough for long-chain reasoning → that's what MiniMax is for. |
| Embeddings / rerank | `bge-m3` (568M) and `bge-reranker-v2-m3` run fine on CPU. Nothing blocked. |
| ASR | PhoWhisper-medium on CPU is ~real-time-ish for short utterances; `faster-whisper` CTranslate2 int8 makes it comfortable. Nothing blocked. |
| Time-series | **Chronos-2 (120M, Apache-2.0) explicitly supports CPU inference.** Nothing blocked — and it's *better* than the sklearn ensemble the NVIDIA warehouse blueprint suggests. |
| Computer vision | Datacenter GPU not needed. Detection belongs on a **~$150–300 edge box per store** (Intel N100 + OpenVINO, or RPi5 + Hailo-8L). This is exactly VTI's "AI box" concept, and it makes [V04](V04-edge-ai-box-store-vision.md) far more feasible than the NVIDIA VSS idea ever was. |
| Face recognition | Not a compute problem, a **licence** problem — see [V10](V10-face-attendance.md). |

## The 12 ideas

| # | Idea | VTI item it answers | Local model | Escalates to MiniMax? | Effort | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| [V01](V01-scan-and-go.md) | **Scan & Go** self-checkout super-app | "Scan&Go Super App for 500+ Supermarkets" | RT-DETRv2 + Qwen3-VL 4B | no | M | ⭐ flagship |
| [V02](V02-ai-staff-scheduling.md) | **AI staff scheduling** — forecast → labour → roster | "AI-Powered Staff Scheduling for 10,000+ Employees", "Digital Scheduling for 200+ Stores" | Chronos-2 + OR-Tools + qwen3.5:4b | yes (NL constraints) | M–L | ⭐ **best pick** |
| [V03](V03-demand-forecast-chronos.md) | **Demand forecasting on Chronos-2** | "AI Demand Forecasting Delivers 10% Higher Sales" | Chronos-2 (zero-shot, covariates) | no | M | ⭐ best pick |
| [V04](V04-edge-ai-box-store-vision.md) | **Edge AI box** — heatmap, queue, shelf gap, footfall | "AI box", heatmaps, remote store monitoring, IoT sensors | RT-DETRv2 + ByteTrack on N100/Hailo | no | M | ⭐ most demoable |
| [V05](V05-personalization-loyalty.md) | **Personalization & loyalty engine** | "Personalization at scale", loyalty platforms, CRM | implicit ALS / LightFM + bge-m3 | no | M | high |
| [V06](V06-omnichannel-product-sync.md) | **Marketplace sync + taxonomy agent** | "Product synchronization across channels", OMO | bge-m3 + qwen3.5:4b | occasionally | S–M | high |
| [V07](V07-document-ai-procurement.md) | **Document AI** — invoice/PO/GRN 3-way match | "Accounting automation", "Cloud Procurement 6X Lower Costs" | PaddleOCR/VietOCR + Qwen3-VL | yes (hard docs) | M | ⭐ clearest ROI |
| [V08](V08-hq-branch-erp-reconciliation.md) | **HQ↔branch / ERP reconciliation agent** | "HQ & Branch Synchronization", SAP/Odoo | qwen3.5:4b + rules | rarely | M | high |
| [V09](V09-vietnamese-voice-kiosk.md) | **Vietnamese voice kiosk / receptionist** | "Virtual Receptionist", smart retail devices | PhoWhisper + viXTTS + qwen3.5:4b | yes | M | high (VI solved) |
| [V10](V10-face-attendance.md) | **Staff attendance & store ops identity** | "FaceX Smart Attendance" | see licence analysis | no | S–M | ⚠ licence/privacy gated |
| [V11](V11-analytics-copilot.md) | **Retail analytics copilot** (NL→SQL→chart) | "Data analytics", Microsoft Gold Partner | qwen3.5:4b + duckdb | yes | M | high |
| [V12](V12-local-model-gateway.md) | **3-tier model gateway** Ollama → vLLM → MiniMax | the foundation under all of the above | n/a | n/a | S | ⭐ do this first |

### Recommended submission from this set

**V12 → V02 → V03 → V07.**

One narrative: *"we put an AI layer on a real retail platform, and the default tier runs on our own
hardware for zero marginal cost."* V12 is the plumbing (1 week). V02+V03 share the Chronos-2 forecast
backbone, so the second is ~40% cheaper once the first lands. V07 is the clearest money slide
(VTI publishes 6× procurement cost reduction; document AI is where that comes from).

Add **V04** if you want the demo people remember — a live camera detecting an empty shelf and raising a
task in `stock-service` beats any chat window.

### Cross-set overlaps to resolve before building

| This set | NVIDIA set | Call |
| --- | --- | --- |
| V03 Chronos-2 forecasting | 05 sklearn ensemble forecasting | **Build V03.** A 120M Apache-2.0 zero-shot FM with covariate support beats hand-tuning five sklearn models, and it needs no training run. Keep the NVIDIA plan's *feature engineering and `dim_calendar` work* — that part is identical and mandatory either way. |
| V11 analytics copilot | 04 Ops RAG structured retriever | **Same component.** Build once, in `ai-service`. V11 adds charting; 04 adds the document retriever. |
| V04 edge AI box | 09 VSS shelf video | **Build V04.** Edge inference on a $200 box is achievable; VSS's validated topology is 2×RTX PRO 6000. |
| V09 Vietnamese voice kiosk | 07 Voice POS | **Build V09's stack** (PhoWhisper + viXTTS), then reuse it for the POS use case. The NVIDIA plan's whole risk section was "Vietnamese ASR unknown"; PhoWhisper removes it. |
| V12 model gateway | 11 LLM Router | **Same component, superset.** V12 adds the local tier and the data-residency rule. Nemotron becomes just one more upstream. |

## Shared prerequisites

1. **Ollama container** on the dev server. Not in `scripts/docker-compose.yml` yet — that's an infra
   addition, coordinate it (`scripts/` is local-only and isn't the deploy path for config).
   Pull `qwen3.5:4b`, `gemma4:e4b`, `bge-m3`, `bge-reranker-v2-m3`.
2. **MiniMax API key** in **OpenBao**, surfaced as `MINIMAX_API_KEY`. Base URL
   `https://api.minimax.io/v1`, OpenAI-compatible, `Authorization: Bearer`.
3. **`ai-service` port move off `:8109`** — Apicurio owns it on the dev server. Same finding as the other set.
4. **Egress test** to `api.minimax.io` through the corporate MITM proxy — day one, with `curl`, before code.
   (The local tier is unaffected by this, which is a real resilience argument in its favour.)
5. **pgvector** (`pgvector/pgvector:pg16` image swap) for V05/V06/V11 retrieval. Same decision as the other set.
6. **A model-licence register** — one table listing every weight file in production, its licence, and
   whether commercial use is permitted. Non-negotiable given YOLO/AGPL and InsightFace/non-commercial
   (see [00-model-stack.md](00-model-stack.md) § Licence traps). This is also a differentiator: almost no
   contest entry will have one.

## Diagrams

`diagrams/*.drawio` — source; `*.drawio.png` — 2× raster with XML embedded (reopen in draw.io to edit);
`*.svg` — vector for slides.

| Diagram | File |
| --- | --- |
| Solution landscape — 12 VTI-derived ideas + 3-tier model serving | `diagrams/landscape-vti.drawio.png` |
| V12 — 3-tier model gateway & routing policy | `diagrams/vti-12-model-gateway.drawio.png` |
| V02 — AI staff scheduling | `diagrams/vti-02-staff-scheduling.drawio.png` |
| V03 — Chronos-2 demand forecasting | `diagrams/vti-03-demand-forecast.drawio.png` |
| V04 — Edge AI box store vision | `diagrams/vti-04-edge-ai-box.drawio.png` |
| V07 — Document AI / procurement 3-way match | `diagrams/vti-07-document-ai.drawio.png` |
