# R05 — In-store service robot: a kiosk that moves

> **Tier C — one rented/borrowed unit** · **Effort:** M (~2.5 weeks on top of C07) · **Verdict:** medium

## The hardware is a commodity — that is the whole point

| Fact | Source |
| --- | --- |
| Commercial service robots grew **37% CAGR 2021–2025**, projected **31.2% CAGR to 2030**. In 2025 **the top five companies worldwide were all Chinese**, >half the global market | [Frost & Sullivan](https://www.manilatimes.net/2026/07/16/tmt-newswire/pr-newswire/pudu-robotics-ranked-no1-globally-in-four-commercial-service-robotics-dimensions-by-frost-sullivan/2385878) |
| **Pudu**: #1 globally in revenue and shipments (~25% / ~23%); #1 in commercial cleaning robotics revenue; overseas sales doubled; HK IPO in preparation | same |
| **Keenon**: **#1 worldwide in shipments in 2025** (IDC); leads the global delivery-robot market; SoftBank partnership | [Barchart](https://www.barchart.com/story/news/33523452/keenon-robotics-continues-global-lead-in-commercial-service-robot-market-securing-triple-no-1-rankings-idc-reports) |
| Both are pivoting to embodied AI — Keenon showed humanoids at **WAIC 2026**, Pudu debuted the **PUDU D7** | [Sina](https://portal.sina.com.hk/finance/finance-prnewswire/prnasia/2026/07/18/1858236/global-commercial-service-robot-shipments-leader-keenon-puts-humanoids-to-work-at-waic-2026/) |

**Nobody should build this robot.** Buy or rent a Pudu/Keenon base with a screen and an API, and put our
software on it.

## What it actually is

[V09](../ai-contest-retail-vti/V09-vietnamese-voice-kiosk.md) is a voice kiosk bolted to a wall.
[C07](../ai-contest-retail-china/C07-chinese-service-guide-agent.md) is a Chinese service/guide agent.
**R05 is those two on wheels**, which unlocks exactly one new capability:

> **"跟我来" — the robot walks the customer to the product.**

Everything else (answer questions, check stock, show promotions) a fixed kiosk already does more cheaply.
So the plan lives or dies on whether *guided escort* is worth the hardware. Be honest about that in the deck.

## Architecture

```
Pudu / Keenon base  (vendor API + screen + mic + speaker)
   ├─ vendor navigation stack (their SLAM, their obstacle avoidance)
   └─ registered as an Open-RMF fleet via a full_control adapter  → R02
        ▼
our software on the robot's screen / on-box compute
   ├─ ASR   Fun-ASR-Nano-2512 (Apache-2.0) — Chinese + dialects
   ├─ agent C07 tool layer, unchanged: search_product · get_stock ·
   │        get_price_for_channel · get_applicable_promotions · get_order_status
   ├─ retrieval RAGFlow over 售后政策 / 产品手册 / FAQ
   ├─ TTS   CosyVoice
   └─ ESCORT: SKU → aisle/bay from the I03 planogram → RMF navigation goal
        ▼
  screen shows the product card while walking; arrival = "就在这一层，左手边"
```

**Screen-first, voice-second** — same rule as V09. A noisy store, a mis-heard SKU code, or a
hard-of-hearing customer are all handled by the display.

**The escort target comes from the planogram**, which means R05 depends on
[I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) having a bay-level location per SKU.
Without that, the robot can only say "aisle 7" — which a sign already does.

## Where it composes

| Reuses | How |
| --- | --- |
| [C07](../ai-contest-retail-china/C07-chinese-service-guide-agent.md) | the entire agent + tool + retrieval layer, unchanged |
| [V09](../ai-contest-retail-vti/V09-vietnamese-voice-kiosk.md) | push-to-talk, screen-first UX, privacy rules |
| [I03](../ai-contest-retail-industry/I03-assortment-space-planogram.md) | SKU → bay location for the escort |
| [R02](R02-fleet-orchestration-openrmf.md) | robot is an RMF fleet; escort is an RMF task competing with scan and cleaning tasks |
| [R10](R10-robot-fleet-governance.md) | human-proximity safety rules — mandatory here, customers are in the loop |

## Build steps

1. **(2 days)** Vendor base evaluation + `full_control` RMF adapter (the same three obligations as
   [R02](R02-fleet-orchestration-openrmf.md): kinematic transform, navigation mapping, `FleetState` sync).
2. **(3 days)** C07 agent on the robot screen; Fun-ASR + CosyVoice on-box or on the edge box.
3. **(3 days)** **Escort task**: SKU → planogram bay → RMF navigation goal → arrival announcement,
   with a follow-me pace and a "lost the customer" timeout.
4. **(2 days)** Idle behaviour: patrol vs park, greeting trigger, and a **do-not-approach** rule
   (never intercept a customer who hasn't engaged).
5. **(2 days)** Safety: speed limits near people, stop-on-approach, emergency stop, incident logging into
   [R10](R10-robot-fleet-governance.md).
6. **(2 days)** Measurement: escorts completed, abandonment rate, questions answered without escalation,
   and — the one that decides the idea — **conversion on escorted vs unescorted product enquiries**,
   as a holdout per [I06](../ai-contest-retail-industry/I06-ai-governance-measurement.md).

## Risks

| Risk | Mitigation |
| --- | --- |
| **Escort is a novelty, not a value driver** | Measure it (step 6). If escorted enquiries don't convert better, the honest output is "a fixed kiosk is sufficient" — and that saves the hardware spend. |
| Customer walks off mid-escort | Timeout + graceful abandon + return to station. Don't chase. |
| Robot blocks an aisle | Speed and inflation limits; RMF mutex groups on narrow aisles; yields to humans always |
| Children / crowds | Stop-on-approach, low speed, no autonomous approach of people |
| Planogram has no bay-level locations | Gate: without I03 bay data the escort degrades to "aisle N", which a sign already provides. Check first. |
| Noise (ASR) | Push-to-talk, directional mic, screen fallback — V09's rules |
| Privacy | No face recognition, no customer tracking, no recording. Same line as [V04](../ai-contest-retail-vti/V04-edge-ai-box-store-vision.md). |
| Vendor lock-in | RMF adapter isolates it; the agent layer is ours and portable |

## Demo script (2 minutes)

1. Customer asks the robot in Chinese where a product is → grounded answer with **real stock and price**.
2. *"带我去"* → robot navigates to the bay, product card on screen the whole way, arrival announcement.
3. Mid-escort, a person steps in front → robot slows and yields; the incident is logged in
   [R10](R10-robot-fleet-governance.md).
4. Meanwhile the fleet console ([R02](R02-fleet-orchestration-openrmf.md)) shows the escort task
   **outranking** a scheduled shelf-scan task — priority policy as data.
5. Slide: conversion on escorted vs unescorted enquiries, with a CI — **including the honest possibility
   that it is not significant.**

## Effort

~14 dev-days on top of [C07](../ai-contest-retail-china/C07-chinese-service-guide-agent.md) and
[R02](R02-fleet-orchestration-openrmf.md), plus one rented base.
