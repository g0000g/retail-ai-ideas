# Chinese open-source stack — models, frameworks, sample repos

Everything here is open-weight or open-source and Chinese-origin. **Verify every licence against the
repo's own LICENSE file before shipping** — terms in this ecosystem changed materially during 2026, and
several projects split code and weight licences.

Snapshot: July 2026.

---

## 1 · Text LLMs

| Model | Licence | Shape | Notes |
| --- | --- | --- | --- |
| **Qwen3 / Qwen3.6** | **Apache-2.0** | `Qwen3.6-35B-A3B` runs on a single consumer GPU or a 24GB Mac | **The default pick.** Cleanest licence, best small-model story, MCPMark 37.0 on tool calling. |
| **DeepSeek V4 / V4-Pro / V4-Flash** | **MIT** | V4-Pro: 1.6T total / 49B active MoE, **1M context** | No user caps, no revenue thresholds, no restriction on fine-tuned derivatives. Argued best all-round open model of 2026; leads SWE-bench Verified and LiveCodeBench for single-shot repair. **V4-Flash** = cheap drop-in. |
| **GLM-5.1 / 5.2** (Zhipu) | **MIT** | GLM-5.1: 754B MoE | Highest SWE-Bench Pro among MIT-licensed models (58.4%); GLM-5.2 strong on Terminal-Bench 2.1 (81.0). |
| **Kimi K2.6** (Moonshot) | **Modified MIT** | | Leads SWE-Bench Pro at 58.6%. Read the modification. |
| Kimi K3 | Modified | ~1.56 TB weights, 2.8T MoE | Commercial sale permitted but **requires a separate agreement above $20M MaaS revenue**, plus on-screen credit above 100M MAU. Serving it is a multi-node infrastructure project. |
| **MiniMax M3** | ⚠ **Restricted — requires a separate commercial licence** | | **This changed.** The VTI set used MiniMax M2/M2.5 (MIT weights, cheap API) as its escalation tier — see [`../ai-contest-retail-vti/00-model-stack.md`](../ai-contest-retail-vti/00-model-stack.md). M3 is not a drop-in on the same terms. Re-verify before relying on it. |

**Two honest caveats to carry into any deck:**
1. **"Open source" is a misnomer here.** These are *open-weight*: weights are published, training data and
   pipeline are not. None are OSI-compliant.
2. **Cost is the structural story.** The market is two regional pools — Western frontier and Chinese
   frontier — with overlapping capability and a reported **5–25× price gap**.

For zero legal ambiguity in a commercial product: **Qwen3 (Apache-2.0) or DeepSeek/GLM (MIT)**.

Sources: [Chinese LLMs 2026 comparison (NextFuture)](https://nextfuture.io.vn/blog/2026-chinese-llm-stack-qwen-deepseek-minimax-kimi-glm-compared) ·
[Best open-source LLMs for AI agents, May 2026 (Lushbinary)](https://lushbinary.com/blog/best-open-source-llms-ai-agents-may-2026-comparison/) ·
[Top 5 Chinese open-source LLM models 2026 (index.dev)](https://www.index.dev/blog/chinese-open-source-llm-models) ·
[Veracity AI — best Chinese open-source LLMs 2026](https://veracityai.com/blog/best-chinese-open-source-llms)

## 2 · Agent & RAG frameworks

| Project | Repo | Licence | Fit |
| --- | --- | --- | --- |
| **Qwen-Agent** | [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | **Apache-2.0** | Function calling, **MCP**, code interpreter in a Docker sandbox, RAG over 1M+ token contexts. Backend of Qwen Chat. Parallel/multi-step/multi-turn tool calls. **For vLLM-served Qwen3/QwQ, do NOT add `--enable-auto-tool-choice --tool-call-parser hermes`** — Qwen-Agent parses tool output itself. |
| **RAGFlow** | [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | **Apache-2.0** | **DeepDoc** layer parses layout, tables, figures and scanned PDFs *before* the vector store — the differentiator for messy documents. GraphRAG-style extraction, chunk visualisation for human review, grounded answers with traceable citations. Depends on MySQL + Elasticsearch/Infinity. |
| Dify | [langgenius/dify](https://github.com/langgenius/dify) | ⚠ commercial use allowed **with restrictions on multi-tenant SaaS** | Best-in-class workflow orchestration; Python/Flask/Postgres + Next.js. |
| FastGPT | [labring/FastGPT](https://github.com/labring/FastGPT) | ⚠ Apache-2.0 **+ additional conditions** — prohibits building competitive services | Quick internal knowledge-base Q&A. Depends on MongoDB. Shallower than the other two. |
| AgentScope | [agentscope-ai](https://github.com/agentscope-ai) | ⚠ **licence unverified — check LICENSE** | Multi-agent framework; MCP / A2A / agent skills, message hub, K8s + OTel deployment. |

**Pick for us: Qwen-Agent (Apache-2.0) + RAGFlow (Apache-2.0).** Both are cleanly licensed, and RAGFlow's
DeepDoc is the piece our own document work ([V07](../ai-contest-retail-vti/V07-document-ai-procurement.md),
[C08](C08-e-fapiao-automation.md)) would otherwise have to build.

Sources: [Jimmy Song — open-source AI agent platform comparison 2026](https://jimmysong.io/blog/open-source-ai-agent-workflow-comparison/) ·
[Dify vs FastGPT vs RAGFlow](https://usedify.app/blog/workflow-platform-comparison-dify-fastgpt-ragflow) ·
[qwen-agent on PyPI](https://pypi.org/project/qwen-agent/)

## 3 · Speech — Alibaba Tongyi Lab (the strongest part of the Chinese stack)

| Project | Repo | Licence | Notes |
| --- | --- | --- | --- |
| **FunASR** | [modelscope/FunASR](https://github.com/modelscope/FunASR) | **code MIT**, weights licensed separately | ASR + VAD + punctuation + speaker verification + diarization + multi-talker. OpenAI-compatible / MCP serving. |
| **SenseVoiceSmall** | [FunAudioLLM/SenseVoiceSmall](https://huggingface.co/FunAudioLLM/SenseVoiceSmall) | ⚠ custom **FunASR Model Open Source License Agreement** | Mandarin, **Cantonese**, English, Japanese, Korean. Reported to beat Whisper on Chinese/Cantonese. Also does emotion recognition and audio-event detection (music, applause, laughter, coughing). |
| **Fun-ASR-Nano-2512** | [QwenAudio/Fun-ASR](https://github.com/QwenAudio/Fun-ASR) | **Apache-2.0** ← the safe one | Chinese + English + Japanese + **Chinese dialects**, trained on tens of millions of hours. `Fun-ASR-MLT-Nano-2512` covers 31 languages. |
| **CosyVoice** | FunAudioLLM | check card | Multilingual generation, **zero-shot voice cloning**, cross-lingual cloning, instruction following. |

**2026 runtime milestones that matter:**
- **2026/05** — vLLM inference engine: native high-throughput batch (**3–5× faster**) + **WebSocket real-time
  streaming**. This is what makes a live digital-human stream feasible.
- **2026/06** — Fun-ASR-Nano on **llama.cpp / GGUF**: single self-contained binary, CPU/edge, built-in VAD,
  no Python at runtime, quantised to **~484 MB**.
- **2026/07/24** — v1.3.29 hotfix for SenseVoice long-audio inference.
- ⚠ Native HF Transformers integration still in review (`transformers#46180`) — use FunASR, vLLM or
  llama.cpp paths.
- ⚠ Repos have migrated to a **`QwenAudio`** GitHub org from the older `FunAudioLLM`/`modelscope` paths.
  Double-check URLs when cloning.

```bash
pip install funasr
```
```python
from funasr import AutoModel
model = AutoModel(model="iic/SenseVoiceSmall")
result = model.generate(input="audio.wav")
```

**Comparison with the VTI set:** that set chose **PhoWhisper** for Vietnamese (844h, 63 provinces).
For *Chinese* audio, SenseVoice/Fun-ASR are the equivalent — and Fun-ASR-Nano's Apache-2.0 weights are a
cleaner licence than PhoWhisper's. Different market, different model, same architecture.

Sources: [FunASR ecosystem](https://www.funasr.com/en/ecosystem.html) · [QwenAudio/SenseVoice](https://github.com/QwenAudio/SenseVoice) · [Tongyi Lab FunAudioLLM overview](https://dev.to/xidaisme/the-latest-in-open-source-ai-from-alibabas-tongyi-lab-funaudiollm-3ebd)

## 4 · Digital human / avatar

| Project | Repo | Notes |
| --- | --- | --- |
| **Duix.Heygem** (formerly HeyGem) | [duixcom/Duix.Heygem](https://github.com/duixcom/Duix.Heygem) · forks: [efarsoft/HeyGem.ai](https://github.com/efarsoft/HeyGem.ai), [zhangchenhaobest/Duix.Heygem](https://github.com/zhangchenhaobest/Duix.Heygem) | By **硅基智能 (Silicon Intelligence)**. Clones appearance + voice from a **10-second video sample**. Text script or audio in → lip-synced video out. Fully **offline**, no internet needed. 8 languages (EN/JA/KO/ZH/FR/DE/AR/ES). Docker on Windows or Ubuntu 22.04; **~100GB disk**. |
| Lite build | same | drops `heygem-tts` and `heygem-asr` → install shrinks **70GB → 13.5GB**, faster generation, but **audio-upload only, no text-to-video**. |
| One-click Windows package | [Caladog/HeyGem](https://github.com/Caladog/HeyGem) | runs without Docker; batch + long video; works on **8GB VRAM**. |

⚠ **The critical limitation for livestream:** HeyGem does cloning and **non-real-time batch synthesis**.
For *interactive* real-time digital humans, Silicon Intelligence directs users to the paid duix.com
platform (~$0.5/hour). → [C01](C01-digital-human-livestream.md) is designed around this constraint rather
than pretending it away.

Sources: [HeyGem local deployment & API guide](https://www.xugj520.cn/en/archives/open-source-digital-human-guide.html) · [Medium — HeyGem overview](https://medium.com/@heygem.ai/heygem-the-open-source-ai-avatar-that-runs-locally-on-your-pc-ac994ef7ae45)

## 5 · Retail computer vision — PaddlePaddle

| Project | Repo | Licence | Notes |
| --- | --- | --- | --- |
| **PP-ShiTuV2** (in PaddleClas) | [PaddlePaddle/PaddleClas](https://github.com/PaddlePaddle/PaddleClas) | **Apache-2.0** | Three modules: **mainbody detection → feature learning → vector retrieval**. Recall@1 up ~8 points over V1. Demo apps include bottled-beverage and **商品 (product) recognition**. |
| **PaddleDetection** | [PaddlePaddle/PaddleDetection](https://github.com/PaddlePaddle/PaddleDetection) | Apache-2.0 | PicoDet (CPU/mobile-friendly, used as PP-ShiTu's detector), PP-YOLOE+, PP-TinyPose, PP-HumanV2, PP-Vehicle. |
| **Goods_Recognition** tutorial | [ColugoMum/Goods_Recognition](https://github.com/ColugoMum/Goods_Recognition) | — | Full training + deployment walkthrough on PP-ShiTu. Advises **~200 annotated images per class**, COCO-format conversion, and **RandomErasing augmentation when occlusion is severe** — directly relevant to dense shelf imagery. |

**The property that makes this the right choice for retail:** because recognition is done by **vector
retrieval**, PP-ShiTu needs **no model retraining when new SKUs appear** — you add gallery embeddings to
the index and use it immediately. Retail SKU churn is constant; a retrain-per-SKU pipeline is a
non-starter. → [C05](C05-product-recognition-shelf-checkout.md)

Public datasets to bootstrap: **SKU-110K** (dense shelf detection), **RP2K** and **Products-10K**
(retrieval gallery).

Note this is a *different* choice from the VTI set, which picked **RT-DETRv2 + ByteTrack** for
[V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md). Both are Apache-2.0 and they solve
different halves: RT-DETRv2 answers *"is there a gap on this shelf?"*, PP-ShiTu answers *"which SKU is
this?"*. They compose.

## 6 · Virtual try-on

| Model | Repo | Licence | Notes |
| --- | --- | --- | --- |
| **CatVTON** | *"Concatenation Is All You Need"* (ICLR 2025) | check repo | **899M total params, only 49M trainable**, 1024×768 output, **runs under 8GB VRAM**, ~35s/inference on GPU. Reproduces garment detail more accurately than IDM-VTON in testing. |
| IDM-VTON | [yisol/IDM-VTON](https://github.com/yisol/IDM-VTON) | ⚠ **CC BY-NC-SA 4.0 — NON-COMMERCIAL** | ECCV 2024, ~4.6k stars. Most-cited "best open VTON", **but not usable commercially**. Expects 3:4 aspect ratio. |
| OOTDiffusion | [levihsu/OOTDiffusion](https://github.com/levihsu/OOTDiffusion) | check repo | AAAI 2025, from Xiao-i Research. **Does not support lower-body garments.** Tested only on Ubuntu 22.04. Weakest in comparison tests. |
| Index | [Zheng-Chong/Awesome-Try-On-Models](https://github.com/Zheng-Chong/Awesome-Try-On-Models) | — | Curated papers + code, tracks IMAGDressing-v1, AnyFit, MMTryon, FLDM-VTON. |

**Licence trap, same shape as InsightFace in the VTI set:** the model everyone cites as best (IDM-VTON) is
**non-commercial**. → [C06](C06-virtual-tryon.md) is built on CatVTON, and says so.

Sources: [FASHN — comparing the top 4 open-source VTON models](https://fashn.ai/blog/comparing-the-top-4-open-source-virtual-try-on-viton-models) · [fashiolabs 2026 comparison](https://fashiolabs.com/blog/open-source-virtual-try-on-compared)

## 7 · Recommenders

| Project | Repo | Licence | Fit |
| --- | --- | --- | --- |
| **EasyRec** | [alibaba/EasyRec](https://github.com/alibaba/EasyRec) | **Apache-2.0** | Industrial-scale matching + ranking + multi-task, config-driven with HPO. AAAI'23. Successor **TorchEasyRec** (PyTorch, GPU accel, hybrid parallelism). |
| **DeepCTR** | [shenweichen/DeepCTR](https://github.com/shenweichen/DeepCTR) | — | Modular deep CTR models for ad/retail ranking. |
| **RecBole** | [RUCAIBox/RecBole](https://github.com/RUCAIBox/RecBole) · [RecBole2.0](https://github.com/RUCAIBox/RecBole2.0) | — | **94 algorithms, 44 benchmark datasets**, unified format. CIKM'21. Ideal as an *evaluation harness*, not a production serving layer. |
| **RecBole-CDR** | [RUCAIBox/RecBole-CDR](https://github.com/RUCAIBox/RecBole-CDR) | — | **Cross-domain recommendation** — unifies data structures and auto-matches overlapping data across domains. Directly relevant to multi-channel retail (store / Douyin / private domain). → [C10](C10-cross-domain-reco-targeting.md) |

## 8 · Private domain / WeCom SCRM — the Java-friendly corner

| Project | Repo | Licence | Notes |
| --- | --- | --- | --- |
| **WxJava** | [binarywang/WxJava](https://github.com/binarywang/WxJava) | — | **The one that matters for us.** Java SDK for WeChat Pay, Open Platform, mini programs, **WeCom**, Channels, official accounts. Our backend is Java 21 / Spring Boot 4.1 — this drops straight in. |
| **MarketGo-SCRM** | [marketgo-scrm/MarketGo-SCRM](https://github.com/marketgo-scrm/MarketGo-SCRM) | — | **Java**, front/back separated microservices. Channel live codes (渠道活码), customer mass messaging, group messaging, Moments. Built for secondary development. |
| **OpenSCRM** | [openscrm/api-server](https://github.com/openscrm/api-server) | **Apache-2.0** | Go + React. Deliberately minimal middleware — **only MySQL and Redis** (delayed queues on Redis, full-text search on MySQL 8, no Kafka/ES). Callback handlers for customer, department, group chat, message archive, staff and tag events. |
| **源雀 Iyque-SCRM** | [IYque/Iyque-SCRM](https://github.com/IYque/Iyque-SCRM) | Apache-2.0 (retain logos/product names) | Full chain prospecting → management → operations → marketing → service → analytics. **RAG knowledge base on Milvus**, WeCom-integrated AI customer service with semantic auto-reply, automatic chat-record capture for later analysis. |
| MoChat | [mochat-cloud/mochat](https://github.com/mochat-cloud/mochat) | — | SCRM application development framework/engine. |
| Pumplabs SCRM | [Pumplabs/scrm](https://github.com/Pumplabs/scrm) | — | For defined sales cycles (renovation, auto, insurance, beauty, education). Channel codes, fission, marketing automation. |
| juhe-scrm | [juhe-scrm/juhe-scrm](https://github.com/juhe-scrm/juhe-scrm) | — | Go + React, aggregated chat, auto-reply. |
| litemall | mall reference | — | Spring Boot + Vue admin + **WeChat mini-program** frontend — the membership/points/order layer. |

**Practical stack:** OpenSCRM or 源雀 for the WeCom customer/tag/群 layer + a mini-program mall for
membership/points + **WxJava** as the SDK from our Java services. → [C02](C02-private-domain-wecom-agent.md)

## 9 · Chinese invoice (发票) OCR

| Project | Repo | Notes |
| --- | --- | --- |
| **Invoice-Manager** | [stone16/Invoice-Manager](https://github.com/stone16/Invoice-Manager) | **The design to copy.** OCR + LLM **dual-source verification** — both run in parallel and cross-check each field, conflicts auto-flagged. PaddleOCR with prompts tuned for 增值税发票. Supports Qwen / DeepSeek / GLM / GPT-4o / Claude / Gemini. Docker Compose, self-hosted. **Works OCR-only with no LLM configured.** |
| guanshuicheng/invoice | [guanshuicheng/invoice](https://github.com/guanshuicheng/invoice) | 增值税发票 OCR, Flask microservice. Extracts 发票代码 / 发票号码 / 开票日期 / 校验码 / 税后金额. Covers 电子普通/普通/专用发票. |
| zhangandin/ocr_invoice | [zhangandin/ocr_invoice](https://github.com/zhangandin/ocr_invoice) | Verification-oriented — only the 4 fields needed for 查验. Ships 7 trained pb models. Old stack (TF 1.8). |
| InvoiceOCRer | [inmine2/InvoiceOCRer](https://github.com/inmine2/InvoiceOCRer) | PaddleOCR + PyQt5 + fitz, extracts to Excel. |
| sanluan/einvoice | [sanluan/einvoice](https://github.com/sanluan/einvoice) | 电子普票 + 电子专票. |

⚠ **None of these do official 查验.** That requires the
[国家税务总局全国增值税发票查验平台](https://inv-veri.chinatax.gov.cn/) or a licensed 服务商 API.
**乐企** is the sanctioned enterprise↔tax-bureau channel for large issuers.

⚠ **The most important design point:** 全电发票 / 数电票 are **OFD/XML-native, not scans**. Parse the
structured data directly and reserve OCR + LLM for image fallbacks. → [C08](C08-e-fapiao-automation.md)

## 10 · Consolidated licence register (start it now)

| Component | Licence | Commercial | Notes |
| --- | --- | --- | --- |
| Qwen3 / Qwen3.6 | Apache-2.0 | ✅ | default LLM |
| DeepSeek V4 / Flash | MIT | ✅ | long-context, cheap |
| GLM-5.1 | MIT | ✅ | |
| Kimi K2.6 | Modified MIT | ⚠ read it | |
| Kimi K3 | Modified | ⚠ agreement > $20M MaaS revenue | |
| **MiniMax M3** | **Restricted** | ❌ **separate licence required** | changed from M2/M2.5 |
| Qwen-Agent | Apache-2.0 | ✅ | |
| RAGFlow | Apache-2.0 | ✅ | |
| Dify | restricted multi-tenant SaaS | ⚠ | |
| FastGPT | Apache-2.0 + conditions | ⚠ no competitive services | |
| FunASR code | MIT | ✅ | **weights are separate** |
| SenseVoiceSmall weights | custom FunASR agreement | ⚠ read it | |
| **Fun-ASR-Nano-2512** | Apache-2.0 | ✅ | the safe ASR weights |
| PaddleClas / PP-ShiTuV2 | Apache-2.0 | ✅ | |
| PaddleDetection | Apache-2.0 | ✅ | |
| **IDM-VTON** | **CC BY-NC-SA 4.0** | ❌ **non-commercial** | do not ship |
| CatVTON | check repo | ⚠ verify | |
| EasyRec | Apache-2.0 | ✅ | |
| OpenSCRM | Apache-2.0 | ✅ | |
| 源雀 Iyque-SCRM | Apache-2.0 + attribution | ✅ retain logos | |
| Duix.Heygem | check repo | ⚠ verify before commercial use | real-time needs the paid platform |

This table is the China-market half of the **model-licence register** required by
[`../ai-contest-retail-industry/I06`](../ai-contest-retail-industry/I06-ai-governance-measurement.md).
Ship it with the entry — declining a capability for a documented licence reason reads as engineering
maturity.
