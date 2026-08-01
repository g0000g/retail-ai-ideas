# C01 — 数字人直播带货: AI digital-human 店播 pipeline

> **Reading:** 📘 PLAYBOOK (transfers to Vietnam) · **Effort:** M–L (~4 weeks) · **GPU:** small GPU for rendering, batch
> **Verdict:** ⭐ flagship — biggest market in the research, and the clearest software-shaped gap

## Why this, and why now

| Evidence | Source |
| --- | --- |
| Livestream GMV **¥7.2T in 2025 → ¥9.08T forecast 2026** (from ¥433.8B in 2019) | [videowise](https://videowise.com/live-commerce/the-state-of-china-live-streaming-shopping-in-2026) |
| **The 2025 structural shift was 店播 — merchant-run streams, not KOL streams.** Merchants growing revenue via 店播 **+45% YoY**; **80,000+ merchants passed ¥1M** livestream GMV; industrial-belt 店播 **+83% YoY** | same |
| Livestreaming to top **$1 trillion** in 2026; China e-commerce approaching **50% of retail** | eMarketer, via same |
| Tencent and Baidu both shipped virtual-human livestream products — positioned as cost reduction + influencer-risk reduction | [FedEx China](https://www.fedex.com/en-cn/business-insights/ecommerce/how-new-experimental-tech-is-powering-e-commerce-in-china.html) |

**The insight worth a slide:** 店播 means the *merchant* runs the stream, continuously, at low cost.
A KOL stream is a talent problem. A 24/7 store stream is a **software problem** — script generation,
product rotation, price/stock accuracy, Q&A, and a presenter that doesn't need to sleep.

We already own the hard half: real SKUs, real prices, real stock, real promotions, real orders.

## The blocker, stated up front

**Duix.Heygem does cloning and *non-real-time batch synthesis*.** For interactive real-time avatars,
Silicon Intelligence directs users to the paid duix.com platform (~$0.5/hour).
See [`00-china-oss-stack.md` §4](00-china-oss-stack.md).

So the honest architecture is **not** "a live AI human answering comments in real time". It is:

```
segment-based streaming:  pre-render a library of short clips  →  play them in a scheduled loop
                          →  splice in freshly-rendered clips as products/prices/answers change
```

That is how most commercial 数字人直播 actually works, and it degrades gracefully: if rendering falls
behind, the loop keeps playing valid older segments instead of going dead.

## Architecture

See `diagrams/china-01-digital-human.drawio.png`.

```
1 · AVATAR + VOICE (one-off, ~1 day per presenter)
    10-second video sample  →  Duix.Heygem clone
    voice sample            →  CosyVoice zero-shot clone
    ⚠ written consent from the person being cloned. Non-negotiable.

2 · SCRIPT (continuous)
    goods-service      SKU, attributes, selling points
    price-service      live price for the channel
    promotion-service  the actual live offer
    stock-service      remaining units  ← the number that drives urgency honestly
         ▼
    Qwen3.6 (Apache-2.0) via Qwen-Agent
      structured output → a segment script: hook · features · price · offer · CTA
      VALIDATOR: no invented price, no invented discount, no invented stock,
                 no absolute superlatives (advertising-law risk), length within bounds

3 · RENDER (batch, GPU, offline)
    script → CosyVoice TTS → Duix.Heygem lip-sync → clip
    每 SKU × 每 offer 变体 一段
    ⚠ 标识办法: mint content ID + provider code INTO THE FILE METADATA at this step
       and burn the explicit on-screen badge into the layout

4 · STREAM (continuous)
    scheduler: rotate clips by SKU priority (stock, margin, promo window, viewer count)
    overlay: live price + stock pulled from the services, NOT baked into the video
    ⚠ if a clip's price no longer matches price-service → pull the clip, re-render

5 · INTERACTION (the honest part)
    live comments → Fun-ASR/text → intent classify (Qwen3.6, tier 0)
      ├─ FAQ            → pre-rendered answer clip from the library
      ├─ product query  → MCP tools (search_product, get_stock, get_price) → text overlay + TTS-only reply
      └─ complex        → escalate to a human operator in the console
    Nobody is promised a real-time talking avatar. Text + voice overlay covers most of it.

6 · ORDER
    on-screen product card → existing storefront checkout → order-service
```

**Design rule that makes this defensible:** *price and stock are never inside the rendered video.*
They are overlays read live from the services. A video clip that hard-codes "只剩 20 件" is a compliance
and trust problem the moment it stops being true.

## Sample repos

| Component | Repo | Notes |
| --- | --- | --- |
| Digital human | [duixcom/Duix.Heygem](https://github.com/duixcom/Duix.Heygem) · [efarsoft/HeyGem.ai](https://github.com/efarsoft/HeyGem.ai) | 10s clone, offline, Docker Win/Ubuntu 22.04, ~100GB disk |
| Lite build | same repo | 70GB → 13.5GB, **audio-upload only, no text-to-video** |
| One-click Windows | [Caladog/HeyGem](https://github.com/Caladog/HeyGem) | no Docker, batch + long video, **works on 8GB VRAM** |
| TTS / voice clone | CosyVoice (FunAudioLLM) | zero-shot + cross-lingual cloning |
| ASR for comments/QC | [QwenAudio/Fun-ASR](https://github.com/QwenAudio/Fun-ASR) — Apache-2.0 weights | vLLM streaming since 2026/05 |
| Script + intent | [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) — Apache-2.0 | MCP, tool calling |
| Channel | [op.jinritemai.com](https://op.jinritemai.com/) 抖店开放平台 | ⚠ enterprise entity required |

## Build steps

**Phase 1 — clip factory (8 days)**
1. Duix.Heygem deployment + one cloned presenter (with written consent). Measure render time per minute of
   video — this number sizes everything downstream.
2. Script generator: Qwen3.6 structured output from real SKU/price/promo data + the validator.
3. CosyVoice TTS; end-to-end script → clip pipeline as a `workflow-service` flow.
4. **Labelling at generation**: content ID + provider code in metadata, explicit badge in the layout.

**Phase 2 — stream assembly (7 days)**
5. Clip library with validity windows (SKU, offer, price-as-of).
6. Scheduler: rotation by stock/margin/promo/viewer-count, with a **price-drift check that pulls stale clips**.
7. Live overlay service reading price + stock from the services.

**Phase 3 — interaction (6 days)**
8. Comment ingest → intent classification (tier 0) → FAQ clip / MCP tool answer / human escalation.
9. Operator console: what's playing, what's queued, escalations, kill switch.

**Phase 4 — commerce + measurement (5 days)**
10. Product card → checkout → `order-service` with a `LIVESTREAM` channel (register it in
    `channel-service` so pricing, promotions and reporting work unchanged — same pattern as the ACP
    channel in [N-03](../ai-contest-retail/03-agentic-commerce-acp-ucp.md)).
11. Metrics: GMV per stream hour, conversion per clip, watch time per segment, escalation rate.
    Holdout per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md): human-run hours vs
    digital-human hours on the same SKU set.

## Risks

| Risk | Mitigation |
| --- | --- |
| **Not real-time** | Segment-based design accepts it. Never promise a live conversational avatar. |
| **标识办法 non-compliance** | Explicit badge + implicit metadata **at generation**, not at publish. Deleting/altering labels is prohibited. [CAC](https://www.cac.gov.cn/2025-03/14/c_1743654685899683.htm) |
| **Consent / likeness rights** | Written consent from the cloned person, scoped and revocable. Never clone a public figure. This is the #1 way this project becomes a lawsuit. |
| Stale price/stock in a rendered clip | Overlays live; drift check pulls clips; price never baked in |
| Advertising-law risk (绝对化用语 — "最好", "第一") | Banned-word validator on every script, per channel |
| Render throughput | Measure in phase 1. Batch overnight; keep an evergreen fallback loop. |
| Uncanny/low engagement | Compare against human-run hours in the holdout. If digital-human hours underperform badly, the honest output is "use it for off-peak coverage only" — which is still valuable. |
| Platform policy on synthetic presenters | Verify Douyin's current rules before piloting; they change. |

## Demo script (4 minutes)

1. Show the 10-second source clip → the cloned presenter.
2. Pick a live SKU in back-office, change its promotion → a new segment script is generated, validated,
   rendered, and enters the rotation.
3. Show the stream: presenter talking, **live price/stock overlay** read from the services, **AI-generated
   badge visible on screen**.
4. Change the price in `price-service` → the stale clip is pulled from rotation automatically.
5. Ask a question in the comments → tool-backed answer with real stock, in Chinese.
6. Buy from the product card → the order appears in back-office on the `LIVESTREAM` channel.
7. Show the file metadata: content ID + provider code, per GB 45438—2025.

Steps 4 and 7 are what separate this from a demo video — they are the parts a Chinese platform reviewer
would actually check.

## Effort

~26 dev-days. Phases 1–2 (15 days) produce a working unattended store stream; phase 3 makes it interactive
enough to be interesting.
