# Model stack — Ollama / Hugging Face open weights + MiniMax API

Every model any idea in this folder uses. **Verify each licence and each context/price figure against the
upstream model card before shipping** — the fast-moving ones change monthly and some of the numbers below
were reported inconsistently across sources.

Facts below reflect a July 2026 check.

---

## 1 · Tier policy

```
Tier 0  LOCAL (default)      Ollama on the dev server, CPU
                             ~4B class · free · private · no egress
                             extraction · classification · routing · structured output
                             embeddings · reranking · ASR · TTS · OCR · time-series · CV

Tier 1  SELF-HOSTED MID      vLLM / SGLang, only if a GPU ever appears
                             14B–30B open weights, MiniMax-M2 or M2.5 weights (MIT)
                             (documented, not built — no GPU today)

Tier 2  MINIMAX API          https://api.minimax.io/v1 · OpenAI-compatible · Bearer auth
                             long-chain reasoning · hard documents · agentic tool loops
                             PII-stripped prompts only
```

Escalation is **explicit and logged**, never implicit. Budget: target ≥85% of turns served by tier 0.

## 2 · Text LLMs

### Tier 0 — local via Ollama (CPU)

| Model | Ollama tag | Params | Why | Notes |
| --- | --- | --- | --- | --- |
| **Qwen3.5 4B** | `qwen3.5:4b` (use a `q4_K_M` quant) | 4B | **The default.** Native function calling, strong multilingual incl. Vietnamese, good structured output | Start at 4K–8K context. Context length is the main CPU trap — memory grows with it; check with `ollama ps` |
| **Gemma 4 E4B** | `gemma4:e4b` | ~4B effective | Native function calling with 6 dedicated special tokens, configurable thinking modes, MCP support via llama.cpp's OpenAI-compatible server. Also has vision | Best pick when tool-calling reliability matters more than raw quality |
| **FunctionGemma 270M** | HF (Dec 2025 release) | 270M | Purpose-built for function calling on mobile/IoT. Absurdly cheap router | Ideal for the intent-router hop in [V11](V11-analytics-copilot.md) and the tier-0/tier-2 escalation decision itself |
| Phi-4-mini-instruct · SmolLM3 3B · Llama 3.2 3B | various | 3–4B | Fallbacks if Qwen/Gemma disappoint on a specific task | Llama 4 is **not** an option: even Scout needs ~70GB VRAM |

**Throughput expectation:** measure it, don't assume. A 4B Q4_K_M on a typical server CPU lands in the
single-to-low-double-digit tokens/sec range. That is fine for classification and extraction, and painful for
a streaming chat UI — which is precisely why the chat-heavy ideas escalate.

Ollama's `/v1/chat/completions` is OpenAI-compatible, so Spring AI 2.0 in `ai-service` talks to it with only
a base-URL change. Same code path as MiniMax. That is the whole architectural point.

### Tier 2 — MiniMax API

| Model | Input $/M | Output $/M | Context | Notes |
| --- | --- | --- | --- | --- |
| **MiniMax-M2.5** | 0.15 | 0.90 | 205K on `MiniMax-M2.5-highspeed`; the full M2.5 advertises 1M — **verify on platform.minimax.io** | **Default escalation target.** Cheapest in the line, 80.2% SWE-Bench Verified, 76.3% BrowseComp, strong agentic tool use |
| MiniMax-M2 | 0.30 | 1.20 | ~205K | The original (Oct 2025). Reasoning model, text-only, **open weights under MIT** |
| MiniMax-M2.1 | 0.30 | 1.20 | ~205K | Superseded by M2.5 on both price and capability |
| MiniMax-M2.7 | 0.24 | 0.96 | ~205K | Production-workflow focus. **Modified-MIT — bars commercial use without authorisation.** Fine via the paid API; do NOT self-host it commercially |
| MiniMax-M3 | 0.30 / 0.60 above 512K | 1.20 / 2.40 above 512K | 1M, tiered | Access-limited upper tier. Only if a single prompt genuinely needs >205K |

**Cost rules that actually matter:**
- Output bills at ~4× input → cap `max_tokens` hard and prompt for concise answers. This is the single
  biggest lever on the bill.
- Reported blended cost for M2 is ~$0.39/M tokens on a 7:2:1 cache/input/output mix — cache hits are cheap,
  so keep prompt prefixes stable.
- Accuracy past 128K is materially worse than at 32K. Treat the big window as **room for retrieval**, not a
  licence to dump the whole catalogue in.
- **Use the native OpenAI-compatible endpoint, not the `/anthropic` shim.** The shim doesn't always re-parse
  stringified tool-call arguments, producing intermittent tool-calling failures where the wrapper key
  rotates between `result`, `arguments` and the tool name.
- `tools`, not the deprecated `function_call`. `/v1/text/chatcompletion_v2` is deprecated.
- M2.x reasoning cannot be disabled; `reasoning_split` only changes how reasoning vs. final content is
  represented. Plan token budgets accordingly.
- Suggested params for structured/analytical work: `temperature=0.2, top_p=0.95`.

## 3 · Embeddings & reranking — Vietnamese first

| Role | Model | Licence | Size | Why |
| --- | --- | --- | --- | --- |
| **Embedding** | `BAAI/bge-m3` | MIT | 568M | **The pick.** Dense + sparse + multi-vector from one model, 100+ languages, 8K context. The hybrid capability matters for Vietnamese: diacritic and named-entity errors are recovered by the sparse half. Available as an Ollama tag |
| Vietnamese-tuned variant | `jaeyong2/bge-m3-Viet` (XLM-R base, MIT) or the `nntoan209/bge-m3-vietnamese` collection | MIT | 568M | Benchmark against plain bge-m3 on *our* SKU names before adopting — a fine-tune isn't automatically better on our domain |
| **Reranker** | `BAAI/bge-reranker-v2-m3` | Apache-2.0 | 568M | Multilingual cross-encoder, CPU-viable, big precision gain on top-k |
| Alternative | `intfloat/multilingual-e5-large`, Qwen3-Embedding | MIT / Apache | 560M+ | Fallbacks |

Store `model_version` on every embedding row. Never mix versions in one index.

## 4 · Vision-language (VLM)

| Model | Licence | Why | CPU? |
| --- | --- | --- | --- |
| **Qwen3-VL / Qwen2.5-VL 3B–7B** | Apache-2.0 (check the exact checkpoint) | Best open OCR-ish + document + product-image understanding at small size | 3B usable on CPU, slow. Batch offline, don't put it in a request path |
| **Gemma 4** (vision variants) | Gemma terms — **not OSI-approved, read the use policy** | Native vision + function calling, ~90% faster on Apple Silicon | small variants yes |
| MiniCPM-V | check checkpoint | Strong small-VLM alternative | yes |
| MiniMax VLM via API | commercial API | Escalation for hard images | n/a |

## 5 · Vietnamese speech

| Role | Model | Licence | Notes |
| --- | --- | --- | --- |
| **ASR** | **`vinai/PhoWhisper`** (tiny/base/small/medium/large) | check the model card | **This is why [V09](V09-vietnamese-voice-kiosk.md) is feasible and the NVIDIA voice idea wasn't.** Whisper fine-tuned on **844 hours** of Vietnamese — Common Voice-vi, VIVOS, VLSP 2020, plus a private set of **26,000 speakers across all 63 provinces**. Half the training set had noise augmentation, so it is deliberately noise-robust — which is exactly the in-store condition |
| ASR runtime | `faster-whisper` (CTranslate2) int8 | MIT | Makes PhoWhisper-medium comfortable on CPU |
| **Known limitation** | — | — | On out-of-domain audio PhoWhisper-large hit **38.3% WER** on the VietLyrics set. Read/conversational speech is its strength; singing, heavy overlap and shouting are not. Budget a domain hotword/bias list for SKU and brand names |
| **TTS** | viXTTS · F5-TTS-Vietnamese · Piper `vi_VN` voices | varies — verify each | Piper is the safe, fast, tiny CPU option; viXTTS/F5 sound better. Check licences individually |

## 6 · OCR / document AI

| Model | Licence | Notes |
| --- | --- | --- |
| **PaddleOCR** | Apache-2.0 | Workhorse. Vietnamese support, layout + table structure, CPU-fine |
| **VietOCR** | check | Vietnamese-specific text recognition; pairs well with PaddleOCR detection |
| dots.ocr · Surya · docTR | varies | Modern alternatives worth benchmarking on real Vietnamese invoices |
| Qwen3-VL | Apache-2.0 (verify) | Fallback for messy/handwritten docs where OCR + rules fail |
| Apache Tika | Apache-2.0 | Non-image documents (PDF text, DOCX). Tables in PDFs remain the weak spot |

## 7 · Computer vision — detection & tracking

**This is where the licence traps live. Read § 10.**

| Role | Model | Licence | Notes |
| --- | --- | --- | --- |
| **Detection** | **RT-DETRv2** | **Apache-2.0** | **The pick.** ~54.3 mAP vs YOLOv8's 53.9, NMS-free end-to-end inference which simplifies deployment. Costs more compute/memory than YOLO and is stronger on occluded scenes — which is what a crowded shelf is |
| Detection alt | RF-DETR (Apache-2.0), LibreYOLO / YOLOX (MIT/Apache) | permissive | Faster YOLO-style baselines without the AGPL problem |
| **Tracking** | **ByteTrack** | **MIT** | Detector-agnostic, drops onto RT-DETRv2 with no licence friction. Retain the notice on redistribution |
| Edge runtime | OpenVINO (Apache-2.0) on Intel N100, or Hailo SDK on RPi5+Hailo-8L | — | See [V04](V04-edge-ai-box-store-vision.md) for the box spec |
| ❌ **Avoid** | Ultralytics YOLOv5/v8/YOLO11/YOLO26 | **AGPL-3.0** | See § 10 |

## 8 · Time series — the standout

| Model | Licence | Params | Why |
| --- | --- | --- | --- |
| **Chronos-2** (`autogluon/chronos-2`, `amazon/chronos-2`) | Apache-2.0 | **120M** | **Use this.** Released Oct 2025. Encoder-only, zero-shot, and handles univariate **+ multivariate + covariate-informed** forecasting in one architecture. Best pretrained-model results on fev-bench, GIFT-Eval and Chronos Benchmark II. **Supports CPU inference.** The covariate support is the retail-critical part: promotions, price, holidays and store metadata go in directly instead of being ignored |
| `chronos-bolt-small` / `-base` | Apache-2.0 | 48M / 205M | Lighter fallback if latency or memory is tight. T5 encoder-decoder, patched context, direct multi-step quantile forecasts, trained on ~100B observations. ~5% more accurate, up to **250× faster** and 20× more memory-efficient than original Chronos; Bolt-base beats original Chronos-large while being 600× faster |
| TimesFM | ⚠ historically **more restrictive than Apache-2.0** — verify the specific checkpoint | 17M/70M/200M | Only if Chronos underperforms on our data |
| Classical baselines | StatsForecast / Prophet (Apache/MIT) | — | Mandatory. Nothing ships that doesn't beat naive-seasonal |

**Honest caveat to state in the pitch:** Chronos-2 was trained on real *and large-scale synthetic* data, and
its leaderboard numbers may overlap public retail datasets. Validate on our own held-out SKUs. The
zero-shot claim ("outperforms models actually trained on those datasets", aggregated over 27 datasets) is
credible but is not a substitute for our own backtest.

## 9 · Recommenders & optimisation

| Role | Library | Licence |
| --- | --- | --- |
| Implicit-feedback matrix factorisation (ALS) | `implicit` | MIT |
| Hybrid content + collaborative | LightFM | Apache-2.0 |
| Experiment harness | RecBole | MIT |
| Content-based similarity | sentence-transformers + bge-m3 | Apache / MIT |
| **Scheduling / rostering** | **Google OR-Tools CP-SAT** | **Apache-2.0** |
| Explainability | SHAP | MIT |

## 10 · Licence traps — read before writing code

1. **Ultralytics YOLO (v5/v8/YOLO11/YOLO26) is AGPL-3.0.** Moved from GPL-3.0 in April 2023. The network
   clause is the problem: if users interact with a modified version over a network — a web app, an API, a
   SaaS — you must offer them the corresponding source. There is no "it only runs on our servers" loophole,
   and the copyleft reaches the **whole derivative work**, not just the YOLO files. The normal business
   answer is to buy a commercial licence. **We use RT-DETRv2 (Apache-2.0) instead, and say so in the deck.**
2. **InsightFace: split licence.** The *code* is MIT, but the *training data and the models trained on it*
   are non-commercial research only — and that covers both manual downloads and the weights the Python
   library auto-downloads. So `pip install insightface` + default `FaceAnalysis()` = non-commercial.
   Commercial licences exist for `buffalo_l/s/m` and `antelopev2`. There is also a community view that
   anything trained on InsightFace embeddings inherits the restriction (contested). → [V10](V10-face-attendance.md)
   is licence-gated, not compute-gated.
3. **MiniMax-M2.7 weights are Modified-MIT** and bar commercial use without authorisation. Self-hosting
   commercially means staying on **M2 or M2.5** (MIT), using the paid API, or getting authorisation.
4. **Gemma models ship under Google's Gemma terms, not an OSI licence.** Usually fine, but it is a use
   policy with restrictions — read it rather than assuming "open weights" means Apache.
5. **TimesFM** checkpoints have historically been more restrictive than Apache-2.0.
6. Whisper fine-tunes (incl. PhoWhisper) inherit constraints from base weights and training data — check the
   specific card.

**Deliverable:** a `model-licence-register` table — model, version, source URL, licence, commercial use
Y/N, where it runs, who approved it. Ship it with the entry. Almost no other contest submission will have
one, and it converts "we used open source" from a cost claim into a governance claim.

## 11 · Data-residency rules (the reason tier 0 is the default)

| Data class | Tier 0 local | Tier 2 MiniMax API |
| --- | --- | --- |
| Customer name, phone, email, address | ✅ | ❌ never |
| Order IDs, SKU codes, quantities | ✅ | ✅ |
| Prices, margins, supplier terms | ✅ | ⚠ only aggregated / anonymised |
| Employee names, schedules, attendance | ✅ | ❌ never — use employee IDs |
| Product descriptions, public catalogue text | ✅ | ✅ |
| Internal SOPs, policies, contracts | ✅ | ⚠ case by case, with sign-off |

Enforcement is a **PII scrubber in front of the tier-2 client**, plus an OPA rule that denies escalation for
prompts carrying flagged field types — not a note in a prompt. Log every escalation with what was stripped.

Basis: Decree 13/2023/ND-CP and Vietnam's Personal Data Protection Law in force from 2026. Confirm the
current obligations with legal; the table above is an engineering default, not legal advice.

## 12 · What to add to the dev stack

| Addition | Why | Cost |
| --- | --- | --- |
| `ollama/ollama` container + a model volume | tier 0 | 0 — CPU, ~10–15GB disk for the four models |
| `pgvector/pgvector:pg16` (image swap) | V05, V06, V11 retrieval | 0 |
| A Python model-serving sidecar (FastAPI) for Chronos-2 / PhoWhisper / PaddleOCR / RT-DETRv2 | these have no Java runtime worth fighting | 1 container. Keep it a **batch/inference sidecar** — it must not join the Spring service mesh |
| 1 edge box per demo store (Intel N100 ~$150, or RPi5 + Hailo-8L ~$250) | V04 | one-off hardware, the cheapest "AI infrastructure" line item you will ever present |
| MiniMax API key in OpenBao | tier 2 | pay-per-token, small |

Everything else — Kafka, Debezium, Apicurio, Redis, MinIO, Mosquitto, pgpool, OPA, Keycloak, OTel/LGTM,
Harness, SonarQube — is already running.

## Sources

- [MiniMax M2.5 — OpenRouter](https://openrouter.ai/minimax/minimax-m2.5) · [M2](https://openrouter.ai/minimax/minimax-m2) · [M2.7](https://openrouter.ai/minimax/minimax-m2.7) · [M2.1](https://openrouter.ai/minimax/minimax-m2.1)
- [MiniMax API pricing breakdown](https://developer.puter.com/tutorials/minimax-api-pricing/) · [pricepertoken](https://pricepertoken.com/pricing-page/model/minimax-minimax-m2) · [MiniMax-M2 analysis](https://artificialanalysis.ai/models/minimax-m2)
- [Access MiniMax using the OpenAI-compatible API](https://developer.puter.com/tutorials/access-minimax-using-openai-compatible-api/) · [MiniMax-M2.5 tool-calling guide](https://github.com/MiniMax-AI/MiniMax-M2.5/blob/main/docs/tool_calling_guide.md) · [MiniMax API docs](https://platform.minimax.io/docs/token-plan/other-tools)
- [Best CPU-only local LLMs in 2026](https://www.popularai.org/p/best-cpu-only-local-llm-2026) · [Ollama July 2026 — v0.32.0 + best models by use case](https://www.promptquorum.com/local-llms/top-open-source-models-ollama) · [Gemma 4 vs Qwen 3.5 vs Llama 4](https://ai.rs/ai-developer/gemma-4-vs-qwen-3-5-vs-llama-4-compared) · [Best small language models 2026](https://localaimaster.com/blog/small-language-models-guide-2026)
- [vinai/PhoWhisper-large](https://huggingface.co/vinai/PhoWhisper-large) · [PhoWhisper paper](https://arxiv.org/pdf/2406.02555) · [VietLyrics WER result](https://arxiv.org/pdf/2510.22295) · [jaeyong2/bge-m3-Viet](https://huggingface.co/jaeyong2/bge-m3-Viet) · [bge-m3 Vietnamese collection](https://huggingface.co/collections/nntoan209/bge-m3-vietnamese-66728a6ff1bef807e020de96)
- [autogluon/chronos-2](https://huggingface.co/autogluon/chronos-2) · [amazon/chronos-2](https://huggingface.co/amazon/chronos-2) · [chronos-bolt-base](https://huggingface.co/amazon/chronos-bolt-base) · [chronos-forecasting repo](https://github.com/amazon-science/chronos-forecasting)
- [RT-DETR licensing](https://playground.roboflow.com/models/baidu/rt-detr) · [RT-DETRv2 Apache-2.0 LICENSE](https://github.com/supervisely-ecosystem/RT-DETRv2/blob/main/LICENSE) · [ByteTrack licensing](https://playground.roboflow.com/models/bytedance/bytetrack) · [YOLO commercial licence guide](https://www.libreyolo.com/articles/yolo-commercial-license) · [YOLO model licences](https://medium.com/@bingbai.jp/yolo-model-licenses-a-developers-guide-da722767b6f8) · [Ultralytics alternatives 2026](https://www.lightly.ai/blog/best-ultralytics-alternatives-in-2026)
- [InsightFace repo + licence](https://github.com/deepinsight/insightface) · [InsightFace commercial model licensing](https://www.insightface.ai/services/models-commercial-licensing) · [licence discussion](https://github.com/deepinsight/insightface/issues/2469)
