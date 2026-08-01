# AI Contest — Retail ideas for the China market

Fourth idea set. Self-directed research on **China retail + Chinese open-source AI**, with a source link
on every claim and a **GitHub repo for every component**.

| Document | What it holds |
| --- | --- |
| [00-china-market-research.md](00-china-market-research.md) | Market facts with sources: livestream ¥7.2T→¥9.08T, instant retail ¥1T, 私域 2026 trends, 社区团购 consolidation, Xiaohongshu, platform enforcement, integration surfaces |
| [00-china-oss-stack.md](00-china-oss-stack.md) | **The repo list.** Models, agent/RAG frameworks, speech, digital human, retail CV, try-on, recommenders, SCRM, invoice OCR — with licences and a consolidated licence register |
| [00-china-compliance.md](00-china-compliance.md) | AI labelling 标识办法 (in force 1 Sep 2025), PIPL cross-border certification (1 Jan 2026), platform rules |

> **Round 2 of this research:** [`../ai-contest-retail-china-r2/`](../ai-contest-retail-china-r2/README.md) — **robotics**
> (Open-RMF cross-brand fleet orchestration, shelf-scanning robots, last-mile dispatch, digital twin, robot
> governance) plus the OSS round 1 missed (Milvus, Xinference, MiniCPM-V). Sorted by a hardware-feasibility
> ladder — tiers A and B need **zero hardware**. C05's PP-ShiTu becomes the perception layer of R01.

## Two readings of "target the China market" — both covered

The instruction is ambiguous in a way that changes what gets built, so both readings are served and each
idea is tagged:

- **🇨🇳 SELL-IN** — make this platform viable *for a merchant operating in China*: Douyin/WeCom channels,
  数电票, PIPL residency, 标识 labelling. C02, C04, C08, and the compliance doc.
- **📘 PLAYBOOK** — China's retail tech is years ahead on livestream, private domain and instant retail;
  the *pattern* transfers to Vietnam even if the platform never ships to China. C01, C03, C09.
- **🧰 STACK** — the component is Chinese open source and is simply the best free option for any market,
  China or not. C05, C06, C07, C10.

If only the second reading was intended, the STACK ideas still apply unchanged and the SELL-IN ones become
the reference for whichever marketplace matters instead.

## Model policy — simpler than the VTI set, for a compliance reason

The VTI set used a 3-tier gateway with **MiniMax API** as the cross-border escalation. **For China that
tier mostly disappears**, and not to save money:

> PIPL requires a lawful basis for cross-border personal-information transfer. The clean architecture is
> **Qwen3 / DeepSeek / GLM served inside China**, with **no cross-border escalation for anything touching
> customer data at all.** Fewer moving parts, not more.

Default stack: **Qwen3.6 (Apache-2.0)** for chat/tools · **DeepSeek V4-Flash (MIT)** for long context ·
**Fun-ASR-Nano-2512 (Apache-2.0)** for ASR · **CosyVoice** for TTS · **bge-m3 (MIT)** for embeddings ·
**PP-ShiTuV2 (Apache-2.0)** for product recognition · **Qwen-Agent + RAGFlow (both Apache-2.0)** for
orchestration and retrieval.

⚠ **MiniMax M3 is now licence-restricted** — it needs a separate commercial licence, unlike the M2/M2.5
weights the VTI set relied on. Re-verify before reusing that plan's escalation tier anywhere.

Still no GPU on our side: everything above has a CPU or small-GPU path, except the digital-human and
try-on renderers, which are **batch/offline** by design.

## The 10 ideas

| # | Idea | Reading | Key repo | Effort | Verdict |
| --- | --- | --- | --- | --- | --- |
| [C01](C01-digital-human-livestream.md) | **数字人直播带货** — AI digital-human 店播 pipeline | 📘 | [duixcom/Duix.Heygem](https://github.com/duixcom/Duix.Heygem) | M–L | ⭐ **flagship — biggest market, clearest gap** |
| [C02](C02-private-domain-wecom-agent.md) | **私域运营 agent** — WeCom SCRM + AI | 🇨🇳 | [openscrm/api-server](https://github.com/openscrm/api-server) · [binarywang/WxJava](https://github.com/binarywang/WxJava) | M | ⭐ #1 trend of 2026 |
| [C03](C03-instant-retail-front-warehouse.md) | **即时零售 / 前置仓** — 30-min allocation | 📘 | OR-Tools + Chronos-2 | M–L | ⭐ ¥1T market |
| [C04](C04-content-factory-douyin-xiaohongshu.md) | **内容中台** — Douyin/Xiaohongshu content, labelled | 🇨🇳 | Qwen3.6 + [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | M | high |
| [C05](C05-product-recognition-shelf-checkout.md) | **商品识别** — shelf + checkout, no retrain per SKU | 🧰 | [PaddleClas PP-ShiTuV2](https://github.com/PaddlePaddle/PaddleClas) | M | ⭐ best technical fit |
| [C06](C06-virtual-tryon.md) | **虚拟试穿** — virtual try-on | 🧰 | CatVTON (**not** IDM-VTON — non-commercial) | S–M | medium |
| [C07](C07-chinese-service-guide-agent.md) | **中文客服/导购 agent** | 🧰 | [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | M | high |
| [C08](C08-e-fapiao-automation.md) | **数电票/全电发票** automation | 🇨🇳 | [stone16/Invoice-Manager](https://github.com/stone16/Invoice-Manager) | M | ⭐ clearest ROI |
| [C09](C09-group-leader-digital-clone.md) | **团长数字分身** — group-leader clone | 📘 | Qwen-Agent + WxJava | M | medium–high |
| [C10](C10-cross-domain-reco-targeting.md) | **跨域推荐 + 人群反漏斗** targeting | 🧰 | [alibaba/EasyRec](https://github.com/alibaba/EasyRec) · [RecBole-CDR](https://github.com/RUCAIBox/RecBole-CDR) | M | high |

### Recommended from this set

**C05 → C01 → C02, with C08 as the ROI slide.**

- **C05 first** — PP-ShiTu needs **no retraining when new SKUs appear** (vector retrieval, add-and-use).
  That property is the single best technical fit to retail in any of the four folders, and it is
  Apache-2.0.
- **C01** is the flagship: ¥7.2T livestream GMV in 2025, and the 2025 shift was **店播 (merchant-run
  streams), up 45% YoY** — a software problem, not a talent problem.
- **C02** answers the #1 published 私域 trend for 2026: *AI moves from optional to standard operating
  infrastructure*. And **WxJava is a Java SDK**, so it drops into our Spring Boot 4.1 stack directly.
- **C08** is where the money slide is, same as V07/I05 in the other folders — but for 全电发票, which are
  **OFD/XML-native**, so the best engineering decision is *not to use OCR at all* on the primary path.

## How this set relates to the other three

| This set | Elsewhere | Relationship |
| --- | --- | --- |
| C05 PP-ShiTu *which SKU is this?* | [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md) RT-DETRv2 *is there a gap?* | **Compose them.** Both Apache-2.0, different halves of the shelf problem. |
| C03 instant retail | [V03](../ai-contest-retail-vti/V03-demand-forecast-chronos.md) forecast | C03 = V03's forecast at 3km × 30-minute granularity. Shares Chronos-2 and `dim_calendar`. |
| C07 Chinese CS agent | [N-01](../ai-contest-retail/01-retail-copilot-mcp.md) copilot | Same MCP tools, Chinese model + RAGFlow retrieval. |
| C08 数电票 | [V07](../ai-contest-retail-vti/V07-document-ai-procurement.md) VN invoices | Same 3-way match engine, different document format. Build the match engine once. |
| C10 cross-domain reco | [V05](../ai-contest-retail-vti/V05-personalization-loyalty.md) personalization | C10 adds cross-domain (RecBole-CDR) + the 人群反漏斗 targeting shape. |
| Compliance doc | [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md) governance | **6 of 7 China compliance items are already built by I06.** Compliance here is re-use, not a new project. |
| ⚠ MiniMax escalation tier | [V12](../ai-contest-retail-vti/V12-local-model-gateway.md) | **M3 licence changed to restricted.** Re-verify V12's tier-2 choice. |

## Prerequisites

1. **Ollama / vLLM with Qwen3.6 + bge-m3** — same as the VTI set, different weights.
2. **`ai-service` off `:8109`** (Apicurio owns it) — same finding in all four folders.
3. **`pgvector/pgvector:pg16`** image swap for retrieval.
4. **`dim_calendar`** — for China, add 春节 / 双11 / 618 / 双12 / 国庆 rather than Tet. Same table shape.
5. **An enterprise entity + scoped Douyin API permissions** if any SELL-IN idea is built — this has lead
   time and is not a coding task.
6. **A model & data licence register** — start from [`00-china-oss-stack.md` §10](00-china-oss-stack.md).

## Diagrams

`diagrams/*.drawio` source · `*.drawio.png` 2× raster with embedded XML · `*.svg` vector for slides.

| Diagram | File |
| --- | --- |
| China landscape — 10 ideas, the OSS stack, compliance rails | `diagrams/landscape-china.drawio.png` |
| C01 — digital-human 店播 pipeline | `diagrams/china-01-digital-human.drawio.png` |
| C02 — 私域 WeCom agent | `diagrams/china-02-private-domain.drawio.png` |
| C03 — instant retail / 前置仓 | `diagrams/china-03-instant-retail.drawio.png` |
| C05 — PP-ShiTu product recognition | `diagrams/china-05-product-recognition.drawio.png` |

---

> **Western counterpart:** [`../ai-contest-retail-west/`](../ai-contest-retail-west/README.md) — same treatment for the
> EU/US market. Binding constraint flips from **where the data lives** (PIPL) to **what the AI system is allowed to
> do** (EU AI Act), and the store-robotics conclusion flips too: **Bossa Nova's cancelled 500-store deployment**
> argues for fixed cameras over a mobile robot in the West. Also carries the **European Accessibility Act**, which
> is the only regulation across all six folders that has already produced lawsuits.
